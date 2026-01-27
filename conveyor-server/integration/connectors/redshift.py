"""
Amazon Redshift connector implementation.

This connector provides full source and destination support for Amazon Redshift data warehouse.
Since Redshift is based on PostgreSQL, we use psycopg2 for connectivity.
"""

import psycopg2
import psycopg2.extras
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
import logging

from integration.connectors.base import (
    BaseConnector,
    ConnectionTestResult,
    DiscoveryResult
)
from integration.connectors.factory import register_connector, ConnectorMetadata
from integration.singer.messages import RecordMessage, SchemaMessage
from integration.singer.schema import TypeMapper
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('redshift')
class RedshiftConnector(BaseConnector):
    """
    Amazon Redshift data warehouse connector.

    Supports:
    - Full table syncs
    - Incremental syncs via timestamp/ID columns
    - Schema discovery from information_schema
    - COPY-based bulk loads from S3
    - Standard inserts and upserts
    """

    def __init__(self, source: 'Source'):
        """
        Initialize Redshift connector.

        Config options from Source model:
        - host: Redshift cluster endpoint
        - port: Port (default: 5439)
        - database: Database name
        - username: Username
        - password: Password (encrypted)
        - ssl: Enable SSL
        - config: Additional config (schema, etc.)
        """
        super().__init__(source)

        self.host = source.host
        self.port = source.port or 5439
        self.database = source.database
        self.user = source.username
        self.password = source.get_password()
        self.schema = self.config.get('schema', 'public')
        self.ssl_enabled = source.ssl

        self._connection = None

    def _get_connection(self):
        """Get or create database connection."""
        if self._connection is None or self._connection.closed:
            try:
                conn_params = {
                    'host': self.host,
                    'port': self.port,
                    'user': self.user,
                    'password': self.password,
                    'database': self.database,
                    'connect_timeout': self.config.get('connection_timeout', 30)
                }

                if self.ssl_enabled:
                    conn_params['sslmode'] = 'require'

                self._connection = psycopg2.connect(**conn_params)
                self._connection.set_session(autocommit=False)

                logger.info(f"Connected to Redshift database: {self.database}")

            except psycopg2.OperationalError as e:
                raise ConnectionError(f"Failed to connect to Redshift: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Unexpected error connecting to Redshift: {str(e)}")

        return self._connection

    def test(self) -> ConnectionTestResult:
        """
        Test Redshift connection.

        Returns:
            ConnectionTestResult with success status and database info
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get Redshift version
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()['version']

            # Get current database and user
            cursor.execute("SELECT CURRENT_DATABASE(), CURRENT_USER;")
            result = cursor.fetchone()

            cursor.close()

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to Redshift database: {result['current_database']}",
                details={
                    'version': version,
                    'database': result['current_database'],
                    'user': result['current_user']
                }
            )

        except ConnectionError as e:
            return ConnectionTestResult(
                success=False,
                message=str(e),
                details={'error_type': 'ConnectionError'}
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message=f"Connection test failed: {str(e)}",
                details={'error_type': type(e).__name__}
            )
        finally:
            self.close()

    def discover(self) -> DiscoveryResult:
        """
        Discover Redshift tables and schemas.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get all tables in the schema
            cursor.execute("""
                SELECT
                    table_schema,
                    table_name,
                    table_type
                FROM information_schema.tables
                WHERE table_schema = %s
                  AND table_type IN ('BASE TABLE', 'VIEW')
                ORDER BY table_name;
            """, (self.schema,))

            tables = cursor.fetchall()
            streams = []
            schemas = {}

            for table in tables:
                table_schema = table['table_schema']
                table_name = table['table_name']

                # Get columns for this table
                cursor.execute("""
                    SELECT
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_schema = %s
                      AND table_name = %s
                    ORDER BY ordinal_position;
                """, (table_schema, table_name))

                columns = cursor.fetchall()

                # Get primary keys
                cursor.execute("""
                    SELECT kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                      AND tc.table_name = kcu.table_name
                    WHERE tc.table_schema = %s
                      AND tc.table_name = %s
                      AND tc.constraint_type = 'PRIMARY KEY'
                    ORDER BY kcu.ordinal_position;
                """, (table_schema, table_name))

                pk_rows = cursor.fetchall()
                primary_keys = [row['column_name'] for row in pk_rows]

                # Build JSON schema
                properties = {}
                required = []

                for col in columns:
                    col_name = col['column_name']
                    data_type = col['data_type']
                    is_nullable = col['is_nullable'] == 'YES'

                    # Map Redshift types to JSON schema types
                    json_type = self._map_redshift_type(data_type)

                    properties[col_name] = {'type': [json_type, 'null'] if is_nullable else json_type}

                    if not is_nullable:
                        required.append(col_name)

                stream = {
                    'name': table_name,
                    'namespace': table_schema,
                    'metadata': {
                        'primary_keys': primary_keys,
                        'table_type': table['table_type']
                    }
                }

                schema = {
                    'type': 'object',
                    'properties': properties,
                    'required': required
                }

                streams.append(stream)
                schemas[table_name] = schema

            cursor.close()
            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover Redshift schemas: {str(e)}")
        finally:
            self.close()

    def _map_redshift_type(self, pg_type: str) -> str:
        """Map Redshift/PostgreSQL data type to JSON schema type."""
        type_map = {
            'smallint': 'number',
            'integer': 'number',
            'bigint': 'number',
            'decimal': 'number',
            'numeric': 'number',
            'real': 'number',
            'double precision': 'number',
            'character varying': 'string',
            'character': 'string',
            'text': 'string',
            'boolean': 'boolean',
            'date': 'string',
            'timestamp': 'string',
            'timestamp without time zone': 'string',
            'timestamp with time zone': 'string',
            'time': 'string',
            'json': 'object',
            'jsonb': 'object',
        }

        return type_map.get(pg_type.lower(), 'string')

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a Redshift table.

        Args:
            stream: Table name
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(
                cursor_factory=psycopg2.extras.RealDictCursor,
                name=f'conveyor_cursor_{stream}'  # Server-side cursor
            )

            # Build SELECT query
            query = f"SELECT * FROM {self.schema}.{stream}"

            # Add WHERE clause for incremental sync
            if state and stream in state:
                bookmark = state[stream]
                if 'last_modified' in bookmark:
                    query += f" WHERE modified_at > '{bookmark['last_modified']}'"

            cursor.execute(query)

            while True:
                rows = cursor.fetchmany(self.batch_size)
                if not rows:
                    break

                for row in rows:
                    # Convert datetime objects to ISO strings
                    record = {}
                    for key, value in dict(row).items():
                        if isinstance(value, datetime):
                            record[key] = value.isoformat()
                        else:
                            record[key] = value

                    yield RecordMessage(
                        stream=stream,
                        record=record,
                        time_extracted=datetime.utcnow()
                    )

            cursor.close()

        except Exception as e:
            raise DataReadError(f"Failed to read from Redshift table {stream}: {str(e)}")
        finally:
            self.close()

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a Redshift table using batch inserts.

        Args:
            stream: Table name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Primary key columns for upsert

        Returns:
            Write statistics
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            records_written = 0
            batch = []

            for record_msg in records:
                batch.append(record_msg.record)

                if len(batch) >= self.batch_size:
                    # Insert batch
                    self._insert_batch(cursor, stream, batch, key_properties)
                    records_written += len(batch)
                    batch = []

            # Insert remaining records
            if batch:
                self._insert_batch(cursor, stream, batch, key_properties)
                records_written += len(batch)

            conn.commit()
            cursor.close()

            return {
                'records_written': records_written,
                'stream': stream
            }

        except Exception as e:
            conn.rollback()
            raise DataWriteError(f"Failed to write to Redshift table {stream}: {str(e)}")
        finally:
            self.close()

    def _insert_batch(self, cursor, table: str, batch: List[Dict], key_properties: Optional[List[str]] = None):
        """Insert a batch of records into a table."""
        if not batch:
            return

        columns = list(batch[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))

        if key_properties:
            # Upsert using temp table and merge pattern
            temp_table = f"temp_{table}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            # Create temp table
            cursor.execute(f"CREATE TEMP TABLE {temp_table} (LIKE {self.schema}.{table})")

            # Insert into temp
            insert_query = f"INSERT INTO {temp_table} ({', '.join(columns)}) VALUES ({placeholders})"
            values = [[record.get(col) for col in columns] for record in batch]
            cursor.executemany(insert_query, values)

            # Delete existing rows
            delete_keys = ' AND '.join([f"{self.schema}.{table}.{k} = {temp_table}.{k}" for k in key_properties])
            cursor.execute(f"""
                DELETE FROM {self.schema}.{table}
                USING {temp_table}
                WHERE {delete_keys}
            """)

            # Insert from temp
            cursor.execute(f"INSERT INTO {self.schema}.{table} SELECT * FROM {temp_table}")

            # Drop temp table
            cursor.execute(f"DROP TABLE {temp_table}")
        else:
            # Simple insert
            insert_query = f"INSERT INTO {self.schema}.{table} ({', '.join(columns)}) VALUES ({placeholders})"
            values = [[record.get(col) for col in columns] for record in batch]
            cursor.executemany(insert_query, values)

    def close(self):
        """Close Redshift connection."""
        if self._connection and not self._connection.closed:
            self._connection.close()
            self._connection = None


# Register metadata
ConnectorMetadata.register_metadata(
    'redshift',
    name='Amazon Redshift',
    description='AWS data warehouse connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['host', 'database', 'username', 'password'],
    optional_config=['port', 'schema', 'ssl']
)

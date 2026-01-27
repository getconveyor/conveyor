"""
Snowflake connector implementation.

This connector provides full source and destination support for Snowflake data warehouse.
"""

import snowflake.connector
from snowflake.connector import DictCursor
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


@register_connector('snowflake')
class SnowflakeConnector(BaseConnector):
    """
    Snowflake data warehouse connector.

    Supports:
    - Full table syncs
    - Incremental syncs via timestamp/ID columns
    - Schema discovery from information_schema
    - MERGE-based upserts
    - OAuth and username/password authentication
    """

    def __init__(self, source: 'Source'):
        """
        Initialize Snowflake connector.

        Config options from Source model:
        - host: Snowflake account (e.g., 'xy12345.us-east-1')
        - database: Database name
        - username: Username
        - password: Password (encrypted) or OAuth token
        - config: Additional config (warehouse, role, schema, etc.)
        """
        super().__init__(source)

        self.account = source.host
        self.database = source.database
        self.user = source.username
        self.password = source.get_password()

        self.warehouse = self.config.get('warehouse')
        self.role = self.config.get('role')
        self.schema = self.config.get('schema', 'PUBLIC')

        self._connection = None

    def _get_connection(self):
        """Get or create Snowflake connection."""
        if self._connection is None or self._connection.is_closed():
            try:
                conn_params = {
                    'account': self.account,
                    'user': self.user,
                    'password': self.password,
                    'database': self.database,
                    'schema': self.schema,
                }

                if self.warehouse:
                    conn_params['warehouse'] = self.warehouse

                if self.role:
                    conn_params['role'] = self.role

                self._connection = snowflake.connector.connect(**conn_params)

                logger.info(f"Connected to Snowflake database: {self.database}")

            except snowflake.connector.errors.DatabaseError as e:
                raise ConnectionError(f"Failed to connect to Snowflake: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Unexpected error connecting to Snowflake: {str(e)}")

        return self._connection

    def test(self) -> ConnectionTestResult:
        """
        Test Snowflake connection.

        Returns:
            ConnectionTestResult with success status and warehouse info
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(DictCursor)

            # Get Snowflake version
            cursor.execute("SELECT CURRENT_VERSION();")
            version = cursor.fetchone()['CURRENT_VERSION()']

            # Get current database, schema, warehouse
            cursor.execute("SELECT CURRENT_DATABASE(), CURRENT_SCHEMA(), CURRENT_WAREHOUSE();")
            result = cursor.fetchone()

            cursor.close()

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to Snowflake database: {self.database}",
                details={
                    'version': version,
                    'database': result['CURRENT_DATABASE()'],
                    'schema': result['CURRENT_SCHEMA()'],
                    'warehouse': result['CURRENT_WAREHOUSE()']
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
        Discover Snowflake tables and schemas.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(DictCursor)

            # Get all tables in the database
            cursor.execute(f"""
                SELECT
                    TABLE_SCHEMA,
                    TABLE_NAME,
                    TABLE_TYPE
                FROM {self.database}.INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                  AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
                ORDER BY TABLE_NAME;
            """, (self.schema,))

            tables = cursor.fetchall()
            streams = []
            schemas = {}

            for table in tables:
                table_schema = table['TABLE_SCHEMA']
                table_name = table['TABLE_NAME']

                # Get columns for this table
                cursor.execute(f"""
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        COLUMN_DEFAULT
                    FROM {self.database}.INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = %s
                      AND TABLE_NAME = %s
                    ORDER BY ORDINAL_POSITION;
                """, (table_schema, table_name))

                columns = cursor.fetchall()

                # Get primary keys
                cursor.execute(f"""
                    SELECT COLUMN_NAME
                    FROM {self.database}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    JOIN {self.database}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                      AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
                      AND tc.TABLE_NAME = kcu.TABLE_NAME
                    WHERE tc.TABLE_SCHEMA = %s
                      AND tc.TABLE_NAME = %s
                      AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                    ORDER BY kcu.ORDINAL_POSITION;
                """, (table_schema, table_name))

                pk_rows = cursor.fetchall()
                primary_keys = [row['COLUMN_NAME'] for row in pk_rows]

                # Build JSON schema
                properties = {}
                required = []

                for col in columns:
                    col_name = col['COLUMN_NAME']
                    data_type = col['DATA_TYPE']
                    is_nullable = col['IS_NULLABLE'] == 'YES'

                    # Map Snowflake types to JSON schema types
                    json_type = self._map_snowflake_type(data_type)

                    properties[col_name] = {'type': [json_type, 'null'] if is_nullable else json_type}

                    if not is_nullable:
                        required.append(col_name)

                stream = {
                    'name': table_name,
                    'namespace': table_schema,
                    'metadata': {
                        'primary_keys': primary_keys,
                        'table_type': table['TABLE_TYPE']
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
            raise SchemaDiscoveryError(f"Failed to discover Snowflake schemas: {str(e)}")
        finally:
            self.close()

    def _map_snowflake_type(self, sf_type: str) -> str:
        """Map Snowflake data type to JSON schema type."""
        sf_type = sf_type.upper()

        if sf_type in ('NUMBER', 'DECIMAL', 'NUMERIC', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'FLOAT', 'DOUBLE'):
            return 'number'
        elif sf_type in ('VARCHAR', 'CHAR', 'CHARACTER', 'STRING', 'TEXT'):
            return 'string'
        elif sf_type in ('BOOLEAN',):
            return 'boolean'
        elif sf_type in ('DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'TIMESTAMP_LTZ', 'TIMESTAMP_NTZ', 'TIMESTAMP_TZ'):
            return 'string'  # Dates as ISO strings
        elif sf_type in ('VARIANT', 'OBJECT', 'ARRAY'):
            return 'object'
        else:
            return 'string'

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a Snowflake table.

        Args:
            stream: Table name
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(DictCursor)

            # Build SELECT query
            query = f"SELECT * FROM {self.database}.{self.schema}.{stream}"

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
                    for key, value in row.items():
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
            raise DataReadError(f"Failed to read from Snowflake table {stream}: {str(e)}")
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
        Write data to a Snowflake table using MERGE.

        Args:
            stream: Table name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Primary key columns for MERGE

        Returns:
            Write statistics
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Create temp table
            temp_table = f"TEMP_{stream}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            # Create temp table with same schema as target
            cursor.execute(f"""
                CREATE TEMPORARY TABLE {temp_table}
                LIKE {self.database}.{self.schema}.{stream}
            """)

            records_written = 0
            batch = []

            for record_msg in records:
                batch.append(record_msg.record)

                if len(batch) >= self.batch_size:
                    # Insert into temp table
                    self._insert_batch(cursor, temp_table, batch)
                    records_written += len(batch)
                    batch = []

            # Insert remaining records
            if batch:
                self._insert_batch(cursor, temp_table, batch)
                records_written += len(batch)

            # MERGE from temp to target
            if key_properties:
                merge_on = ' AND '.join([f"target.{k} = source.{k}" for k in key_properties])
                update_set = ', '.join([f"{k} = source.{k}" for k in batch[0].keys() if k not in key_properties])

                cursor.execute(f"""
                    MERGE INTO {self.database}.{self.schema}.{stream} AS target
                    USING {temp_table} AS source
                    ON {merge_on}
                    WHEN MATCHED THEN UPDATE SET {update_set}
                    WHEN NOT MATCHED THEN INSERT VALUES ({', '.join(['source.' + k for k in batch[0].keys()])})
                """)
            else:
                # Simple insert from temp
                cursor.execute(f"""
                    INSERT INTO {self.database}.{self.schema}.{stream}
                    SELECT * FROM {temp_table}
                """)

            conn.commit()
            cursor.close()

            return {
                'records_written': records_written,
                'stream': stream
            }

        except Exception as e:
            conn.rollback()
            raise DataWriteError(f"Failed to write to Snowflake table {stream}: {str(e)}")
        finally:
            self.close()

    def _insert_batch(self, cursor, table: str, batch: List[Dict]):
        """Insert a batch of records into a table."""
        if not batch:
            return

        columns = list(batch[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"

        values = [[record.get(col) for col in columns] for record in batch]
        cursor.executemany(insert_query, values)

    def close(self):
        """Close Snowflake connection."""
        if self._connection and not self._connection.is_closed():
            self._connection.close()
            self._connection = None


# Register metadata
ConnectorMetadata.register_metadata(
    'snowflake',
    name='Snowflake',
    description='Cloud data warehouse connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['account', 'database', 'username', 'password'],
    optional_config=['warehouse', 'role', 'schema']
)

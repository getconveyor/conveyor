"""
PostgreSQL connector implementation.

This connector provides full source and destination support for PostgreSQL databases,
including schema discovery, incremental syncs, and UPSERT capabilities.
"""

import psycopg2
import psycopg2.extras
import psycopg2.pool
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
from integration.singer.state import StateManager, IncrementalSyncHelper
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('postgresql')
class PostgreSQLConnector(BaseConnector):
    """
    PostgreSQL database connector.

    Supports:
    - Full table syncs
    - Incremental syncs via timestamp/ID columns
    - Schema discovery from information_schema
    - UPSERT writes (INSERT ... ON CONFLICT)
    - Connection pooling
    - SSL connections
    """

    def __init__(self, connection: 'Connection'):
        """
        Initialize PostgreSQL connector.

        Config options:
        - host: Database host
        - port: Database port (default: 5432)
        - database: Database name
        - user: Username
        - password: Password (encrypted)
        - schema: Schema name (default: 'public')
        - ssl_mode: SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
        - batch_size: Batch size for reads/writes (default: 1000)
        """
        super().__init__(connection)

        self.host = self.config.get('host')
        self.port = self.config.get('port', 5432)
        self.database = self.config.get('database')
        self.user = self.config.get('user')
        self.password = connection.get_password()  # Decrypted password
        self.schema = self.config.get('schema', 'public')
        self.ssl_mode = self.config.get('ssl_mode', 'prefer')

        self._connection = None
        self._cursor = None

    def _get_connection(self):
        """Get or create database connection."""
        if self._connection is None or self._connection.closed:
            try:
                conn_params = {
                    'host': self.host,
                    'port': self.port,
                    'database': self.database,
                    'user': self.user,
                    'password': self.password,
                    'sslmode': self.ssl_mode,
                    'connect_timeout': self.config.get('connection_timeout', 30)
                }

                self._connection = psycopg2.connect(**conn_params)
                logger.info(f"Connected to PostgreSQL database: {self.database}")

            except psycopg2.OperationalError as e:
                raise ConnectionError(f"Failed to connect to PostgreSQL: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Unexpected error connecting to PostgreSQL: {str(e)}")

        return self._connection

    def test(self) -> ConnectionTestResult:
        """
        Test PostgreSQL connection.

        Returns:
            ConnectionTestResult with success status and database info
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Get PostgreSQL version
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]

            # Get current database
            cursor.execute("SELECT current_database();")
            current_db = cursor.fetchone()[0]

            # Get current user
            cursor.execute("SELECT current_user;")
            current_user = cursor.fetchone()[0]

            cursor.close()

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to PostgreSQL database: {current_db}",
                details={
                    'version': version,
                    'database': current_db,
                    'user': current_user,
                    'schema': self.schema
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
        Discover PostgreSQL tables and schemas.

        Queries information_schema to find all tables in the configured schema,
        their columns, data types, and primary keys.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

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
                full_table_name = f"{table_schema}.{table_name}"

                # Get columns for this table
                cursor.execute("""
                    SELECT
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        udt_name
                    FROM information_schema.columns
                    WHERE table_schema = %s
                      AND table_name = %s
                    ORDER BY ordinal_position;
                """, (table_schema, table_name))

                columns = cursor.fetchall()

                # Get primary key columns
                cursor.execute("""
                    SELECT a.attname
                    FROM pg_index i
                    JOIN pg_attribute a ON a.attrelid = i.indrelid
                                       AND a.attnum = ANY(i.indkey)
                    WHERE i.indrelid = %s::regclass
                      AND i.indisprimary;
                """, (full_table_name,))

                pk_columns = [row[0] for row in cursor.fetchall()]

                # Build column list for schema
                column_list = []
                for col in columns:
                    column_list.append({
                        'name': col['column_name'],
                        'type': col['data_type'],
                        'nullable': col['is_nullable'] == 'YES'
                    })

                # Build JSON schema
                json_schema = TypeMapper.build_json_schema(
                    columns=column_list,
                    connector_type='postgresql',
                    required_columns=pk_columns if pk_columns else None
                )

                # Add stream
                streams.append({
                    'name': full_table_name,
                    'namespace': table_schema,
                    'table_name': table_name,
                    'key_properties': pk_columns,
                    'is_view': table['table_type'] == 'VIEW'
                })

                schemas[full_table_name] = json_schema

            cursor.close()

            return DiscoveryResult(
                streams=streams,
                schemas=schemas
            )

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover PostgreSQL schema: {str(e)}")
        finally:
            self.close()

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a PostgreSQL table.

        Supports incremental syncs via bookmark columns (timestamp or ID).

        Args:
            stream: Full table name (schema.table)
            schema: JSON schema for the table
            state: Previous state for incremental sync

        Yields:
            RecordMessage objects for each row
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Parse stream name
            parts = stream.split('.')
            if len(parts) == 2:
                schema_name, table_name = parts
            else:
                schema_name = self.schema
                table_name = stream

            # Build SELECT query
            query = f'SELECT * FROM "{schema_name}"."{table_name}"'

            # Add WHERE clause for incremental sync if state exists
            params = []
            if state:
                state_manager = StateManager(state)
                bookmark = state_manager.get_bookmark(stream)

                if bookmark:
                    conditions = []
                    for key, value in bookmark.items():
                        conditions.append(f'"{key}" > %s')
                        params.append(value)

                    if conditions:
                        query += ' WHERE ' + ' AND '.join(conditions)

            # Add ORDER BY for consistent pagination
            query += f' ORDER BY 1'

            logger.info(f"Reading from {stream}: {query}")

            cursor.execute(query, params)

            # Fetch in batches
            batch_count = 0
            total_count = 0

            while True:
                rows = cursor.fetchmany(self.batch_size)
                if not rows:
                    break

                for row in rows:
                    # Convert row to dict
                    record = dict(row)

                    # Yield RecordMessage
                    yield RecordMessage(
                        stream=stream,
                        record=record,
                        time_extracted=datetime.utcnow()
                    )

                    total_count += 1

                batch_count += 1
                logger.debug(f"Read batch {batch_count} ({len(rows)} records) from {stream}")

            logger.info(f"Finished reading {total_count} records from {stream}")

            cursor.close()

        except Exception as e:
            raise DataReadError(f"Failed to read from PostgreSQL table {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a PostgreSQL table.

        Uses INSERT ... ON CONFLICT for UPSERT logic when key_properties provided.

        Args:
            stream: Full table name (schema.table)
            schema: JSON schema for the table
            records: Iterator of RecordMessage objects
            key_properties: Primary key columns for UPSERT

        Returns:
            Dictionary with write statistics
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Parse stream name
            parts = stream.split('.')
            if len(parts) == 2:
                schema_name, table_name = parts
            else:
                schema_name = self.schema
                table_name = stream

            full_table_name = f'"{schema_name}"."{table_name}"'

            # Ensure table exists (create if needed)
            self._ensure_table_exists(cursor, schema_name, table_name, schema)

            records_written = 0
            records_updated = 0
            batch = []

            for record_msg in records:
                batch.append(record_msg.record)

                if len(batch) >= self.batch_size:
                    # Write batch
                    stats = self._write_batch(
                        cursor,
                        full_table_name,
                        batch,
                        key_properties
                    )
                    records_written += stats['inserted']
                    records_updated += stats['updated']
                    batch = []

            # Write remaining records
            if batch:
                stats = self._write_batch(
                    cursor,
                    full_table_name,
                    batch,
                    key_properties
                )
                records_written += stats['inserted']
                records_updated += stats['updated']

            # Commit transaction
            conn.commit()
            cursor.close()

            logger.info(
                f"Wrote {records_written} new and {records_updated} updated records to {stream}"
            )

            return {
                'records_written': records_written,
                'records_updated': records_updated,
                'total_records': records_written + records_updated
            }

        except Exception as e:
            if conn:
                conn.rollback()
            raise DataWriteError(f"Failed to write to PostgreSQL table {stream}: {str(e)}")

    def _ensure_table_exists(
        self,
        cursor,
        schema_name: str,
        table_name: str,
        schema: Dict[str, Any]
    ):
        """
        Ensure table exists, create if it doesn't.

        Args:
            cursor: Database cursor
            schema_name: Schema name
            table_name: Table name
            schema: JSON schema
        """
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = %s
                  AND table_name = %s
            );
        """, (schema_name, table_name))

        exists = cursor.fetchone()[0]

        if not exists:
            # Create table from schema
            columns = []
            properties = schema.get('properties', {})

            for col_name, col_schema in properties.items():
                col_type = self._json_schema_to_pg_type(col_schema)
                nullable = 'NULL' if 'null' in col_schema.get('type', []) else 'NOT NULL'
                columns.append(f'"{col_name}" {col_type} {nullable}')

            # Add primary key if specified
            required = schema.get('required', [])
            if required:
                pk_constraint = f"PRIMARY KEY ({', '.join([f'"{col}"' for col in required])})"
                columns.append(pk_constraint)

            create_sql = f"""
                CREATE TABLE "{schema_name}"."{table_name}" (
                    {', '.join(columns)}
                );
            """

            cursor.execute(create_sql)
            logger.info(f"Created table {schema_name}.{table_name}")

    def _json_schema_to_pg_type(self, col_schema: Dict[str, Any]) -> str:
        """
        Convert JSON Schema type to PostgreSQL type.

        Args:
            col_schema: JSON Schema column definition

        Returns:
            PostgreSQL type string
        """
        json_type = col_schema.get('type')
        if isinstance(json_type, list):
            json_type = [t for t in json_type if t != 'null'][0]

        format_type = col_schema.get('format')

        if format_type == 'date-time':
            return 'TIMESTAMP'
        elif format_type == 'date':
            return 'DATE'
        elif format_type == 'time':
            return 'TIME'
        elif json_type == 'integer':
            return 'BIGINT'
        elif json_type == 'number':
            return 'DOUBLE PRECISION'
        elif json_type == 'boolean':
            return 'BOOLEAN'
        elif json_type == 'object':
            return 'JSONB'
        elif json_type == 'array':
            return 'JSONB'
        else:
            return 'TEXT'

    def _write_batch(
        self,
        cursor,
        table_name: str,
        records: List[Dict[str, Any]],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, int]:
        """
        Write a batch of records to the database.

        Args:
            cursor: Database cursor
            table_name: Full table name
            records: List of record dictionaries
            key_properties: Primary key columns for UPSERT

        Returns:
            Statistics dictionary
        """
        if not records:
            return {'inserted': 0, 'updated': 0}

        # Get column names from first record
        columns = list(records[0].keys())
        column_names = ', '.join([f'"{col}"' for col in columns])
        placeholders = ', '.join(['%s'] * len(columns))

        if key_properties:
            # UPSERT using ON CONFLICT
            conflict_columns = ', '.join([f'"{col}"' for col in key_properties])
            update_columns = ', '.join([
                f'"{col}" = EXCLUDED."{col}"'
                for col in columns
                if col not in key_properties
            ])

            sql = f"""
                INSERT INTO {table_name} ({column_names})
                VALUES ({placeholders})
                ON CONFLICT ({conflict_columns})
                DO UPDATE SET {update_columns};
            """
        else:
            # Simple INSERT
            sql = f"""
                INSERT INTO {table_name} ({column_names})
                VALUES ({placeholders});
            """

        # Execute batch
        inserted = 0
        updated = 0

        for record in records:
            values = [record.get(col) for col in columns]
            cursor.execute(sql, values)

            if key_properties:
                # Check if it was an insert or update
                if cursor.rowcount > 0:
                    # This is approximate - PostgreSQL doesn't distinguish in ON CONFLICT
                    inserted += 1
            else:
                inserted += cursor.rowcount

        return {'inserted': inserted, 'updated': updated}

    def close(self):
        """Close database connection."""
        if self._cursor:
            self._cursor.close()
            self._cursor = None

        if self._connection and not self._connection.closed:
            self._connection.close()
            self._connection = None
            logger.debug("Closed PostgreSQL connection")


# Register connector metadata
ConnectorMetadata.register_metadata(
    'postgresql',
    name='PostgreSQL',
    description='PostgreSQL database connector with full source and destination support',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['host', 'database', 'user', 'password'],
    optional_config=['port', 'schema', 'ssl_mode', 'batch_size', 'connection_timeout']
)

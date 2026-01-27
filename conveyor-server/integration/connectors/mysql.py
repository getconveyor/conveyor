"""
MySQL connector implementation.

This connector provides full source and destination support for MySQL databases,
including schema discovery, incremental syncs, and UPSERT capabilities.
"""

import pymysql
import pymysql.cursors
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


@register_connector('mysql')
class MySQLConnector(BaseConnector):
    """
    MySQL database connector.

    Supports:
    - Full table syncs
    - Incremental syncs via timestamp/ID columns
    - Schema discovery from information_schema
    - UPSERT writes (INSERT ... ON DUPLICATE KEY UPDATE)
    - SSL connections
    """

    def __init__(self, source: 'Source'):
        """
        Initialize MySQL connector.

        Config options from Source model:
        - host: Database host
        - port: Database port (default: 3306)
        - database: Database name
        - username: Username
        - password: Password (encrypted)
        - ssl: Enable SSL
        - config: Additional config (charset, ssl_ca, batch_size, etc.)
        """
        super().__init__(source)

        self.host = source.host
        self.port = source.port or 3306
        self.database = source.database
        self.user = source.username
        self.password = source.get_password()  # Decrypted password
        self.charset = self.config.get('charset', 'utf8mb4')
        self.ssl_enabled = source.ssl
        self.ssl_ca = self.config.get('ssl_ca')

        self._connection = None
        self._cursor = None

    def _get_connection(self):
        """Get or create database connection."""
        if self._connection is None or not self._connection.open:
            try:
                conn_params = {
                    'host': self.host,
                    'port': self.port,
                    'user': self.user,
                    'password': self.password,
                    'database': self.database,
                    'charset': self.charset,
                    'cursorclass': pymysql.cursors.DictCursor,
                    'connect_timeout': self.config.get('connection_timeout', 30)
                }

                # Add SSL if enabled
                if self.ssl_enabled:
                    ssl_config = {}
                    if self.ssl_ca:
                        ssl_config['ca'] = self.ssl_ca
                    conn_params['ssl'] = ssl_config if ssl_config else True

                self._connection = pymysql.connect(**conn_params)
                logger.info(f"Connected to MySQL database: {self.database}")

            except pymysql.OperationalError as e:
                raise ConnectionError(f"Failed to connect to MySQL: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Unexpected error connecting to MySQL: {str(e)}")

        return self._connection

    def test(self) -> ConnectionTestResult:
        """
        Test MySQL connection.

        Returns:
            ConnectionTestResult with success status and database info
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Get MySQL version
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()['VERSION()']

            # Get current database
            cursor.execute("SELECT DATABASE();")
            current_db = cursor.fetchone()['DATABASE()']

            # Get current user
            cursor.execute("SELECT CURRENT_USER();")
            current_user = cursor.fetchone()['CURRENT_USER()']

            cursor.close()

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to MySQL database: {current_db}",
                details={
                    'version': version,
                    'database': current_db,
                    'user': current_user
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
        Discover MySQL tables and schemas.

        Queries information_schema to find all tables in the configured database,
        their columns, data types, and primary keys.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Get all tables in the database
            cursor.execute("""
                SELECT
                    TABLE_SCHEMA,
                    TABLE_NAME,
                    TABLE_TYPE
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = %s
                  AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
                ORDER BY TABLE_NAME;
            """, (self.database,))

            tables = cursor.fetchall()
            streams = []
            schemas = {}

            for table in tables:
                table_schema = table['TABLE_SCHEMA']
                table_name = table['TABLE_NAME']
                full_table_name = f"{table_schema}.{table_name}"

                # Get columns for this table
                cursor.execute("""
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        COLUMN_DEFAULT,
                        COLUMN_TYPE
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = %s
                      AND TABLE_NAME = %s
                    ORDER BY ORDINAL_POSITION;
                """, (table_schema, table_name))

                columns = cursor.fetchall()

                # Get primary key columns
                cursor.execute("""
                    SELECT COLUMN_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = %s
                      AND TABLE_NAME = %s
                      AND CONSTRAINT_NAME = 'PRIMARY'
                    ORDER BY ORDINAL_POSITION;
                """, (table_schema, table_name))

                pk_columns = [row['COLUMN_NAME'] for row in cursor.fetchall()]

                # Build column list for schema
                column_list = []
                for col in columns:
                    column_list.append({
                        'name': col['COLUMN_NAME'],
                        'type': col['DATA_TYPE'],
                        'nullable': col['IS_NULLABLE'] == 'YES'
                    })

                # Build JSON schema
                json_schema = TypeMapper.build_json_schema(
                    columns=column_list,
                    connector_type='mysql',
                    required_columns=pk_columns if pk_columns else None
                )

                # Add stream
                streams.append({
                    'name': full_table_name,
                    'namespace': table_schema,
                    'table_name': table_name,
                    'key_properties': pk_columns,
                    'is_view': table['TABLE_TYPE'] == 'VIEW'
                })

                schemas[full_table_name] = json_schema

            cursor.close()

            return DiscoveryResult(
                streams=streams,
                schemas=schemas
            )

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover MySQL schema: {str(e)}")
        finally:
            self.close()

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a MySQL table.

        Supports incremental syncs via bookmark columns (timestamp or ID).

        Args:
            stream: Full table name (database.table)
            schema: JSON schema for the table
            state: Previous state for incremental sync

        Yields:
            RecordMessage objects for each row
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Parse stream name
            parts = stream.split('.')
            if len(parts) == 2:
                database_name, table_name = parts
            else:
                database_name = self.database
                table_name = stream

            # Build SELECT query
            query = f'SELECT * FROM `{database_name}`.`{table_name}`'

            # Add WHERE clause for incremental sync if state exists
            params = []
            if state:
                state_manager = StateManager(state)
                bookmark = state_manager.get_bookmark(stream)

                if bookmark:
                    conditions = []
                    for key, value in bookmark.items():
                        conditions.append(f'`{key}` > %s')
                        params.append(value)

                    if conditions:
                        query += ' WHERE ' + ' AND '.join(conditions)

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
                    # Convert datetime objects to ISO format strings
                    record = {}
                    for key, value in row.items():
                        if isinstance(value, datetime):
                            record[key] = value.isoformat()
                        else:
                            record[key] = value

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
            raise DataReadError(f"Failed to read from MySQL table {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a MySQL table.

        Uses INSERT ... ON DUPLICATE KEY UPDATE for UPSERT logic when key_properties provided.

        Args:
            stream: Full table name (database.table)
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
                database_name, table_name = parts
            else:
                database_name = self.database
                table_name = stream

            full_table_name = f'`{database_name}`.`{table_name}`'

            # Ensure table exists (create if needed)
            self._ensure_table_exists(cursor, database_name, table_name, schema)

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
            raise DataWriteError(f"Failed to write to MySQL table {stream}: {str(e)}")

    def _ensure_table_exists(
        self,
        cursor,
        database_name: str,
        table_name: str,
        schema: Dict[str, Any]
    ):
        """
        Ensure table exists, create if it doesn't.

        Args:
            cursor: Database cursor
            database_name: Database name
            table_name: Table name
            schema: JSON schema
        """
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = %s
              AND TABLE_NAME = %s;
        """, (database_name, table_name))

        exists = cursor.fetchone()['count'] > 0

        if not exists:
            # Create table from schema
            columns = []
            properties = schema.get('properties', {})

            for col_name, col_schema in properties.items():
                col_type = self._json_schema_to_mysql_type(col_schema)
                nullable = 'NULL' if 'null' in col_schema.get('type', []) else 'NOT NULL'
                columns.append(f'`{col_name}` {col_type} {nullable}')

            # Add primary key if specified
            required = schema.get('required', [])
            if required:
                pk_cols = ', '.join([f'`{col}`' for col in required])
                pk_constraint = f"PRIMARY KEY ({pk_cols})"
                columns.append(pk_constraint)

            create_sql = f"""
                CREATE TABLE `{database_name}`.`{table_name}` (
                    {', '.join(columns)}
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """

            cursor.execute(create_sql)
            logger.info(f"Created table {database_name}.{table_name}")

    def _json_schema_to_mysql_type(self, col_schema: Dict[str, Any]) -> str:
        """
        Convert JSON Schema type to MySQL type.

        Args:
            col_schema: JSON Schema column definition

        Returns:
            MySQL type string
        """
        json_type = col_schema.get('type')
        if isinstance(json_type, list):
            json_type = [t for t in json_type if t != 'null'][0]

        format_type = col_schema.get('format')

        if format_type == 'date-time':
            return 'DATETIME'
        elif format_type == 'date':
            return 'DATE'
        elif format_type == 'time':
            return 'TIME'
        elif json_type == 'integer':
            return 'BIGINT'
        elif json_type == 'number':
            return 'DOUBLE'
        elif json_type == 'boolean':
            return 'BOOLEAN'
        elif json_type == 'object':
            return 'JSON'
        elif json_type == 'array':
            return 'JSON'
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
        column_names = ', '.join([f'`{col}`' for col in columns])
        placeholders = ', '.join(['%s'] * len(columns))

        if key_properties:
            # UPSERT using ON DUPLICATE KEY UPDATE
            update_columns = ', '.join([
                f'`{col}` = VALUES(`{col}`)'
                for col in columns
                if col not in key_properties
            ])

            sql = f"""
                INSERT INTO {table_name} ({column_names})
                VALUES ({placeholders})
                ON DUPLICATE KEY UPDATE {update_columns};
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

            if key_properties and cursor.rowcount == 2:
                # MySQL returns 2 for updates with ON DUPLICATE KEY UPDATE
                updated += 1
            else:
                inserted += 1

        return {'inserted': inserted, 'updated': updated}

    def close(self):
        """Close database connection."""
        if self._cursor:
            self._cursor.close()
            self._cursor = None

        if self._connection and self._connection.open:
            self._connection.close()
            self._connection = None
            logger.debug("Closed MySQL connection")


# Register connector metadata
ConnectorMetadata.register_metadata(
    'mysql',
    name='MySQL',
    description='MySQL database connector with full source and destination support',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['host', 'database', 'user', 'password'],
    optional_config=['port', 'charset', 'ssl_ca', 'batch_size', 'connection_timeout']
)

"""
Google BigQuery connector implementation.

This connector provides full source and destination support for Google BigQuery.
"""

from google.cloud import bigquery
from google.oauth2 import service_account
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
import logging
import json

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


@register_connector('bigquery')
class BigQueryConnector(BaseConnector):
    """
    Google BigQuery data warehouse connector.

    Supports:
    - Full table syncs
    - Incremental syncs via timestamp/ID columns
    - Schema discovery from INFORMATION_SCHEMA
    - Streaming inserts and batch loads
    - Service account and OAuth authentication
    """

    def __init__(self, source: 'Source'):
        """
        Initialize BigQuery connector.

        Config options from Source model:
        - host: Project ID (stored in host field)
        - database: Dataset name
        - config: Service account JSON or OAuth credentials
        """
        super().__init__(source)

        self.project_id = source.host
        self.dataset_id = source.database

        # Get credentials from config
        self.credentials_json = self.config.get('credentials_json') or self.config.get('service_account')

        self._client = None

    def _get_client(self):
        """Get or create BigQuery client."""
        if self._client is None:
            try:
                if self.credentials_json:
                    # Use service account credentials
                    if isinstance(self.credentials_json, str):
                        credentials_info = json.loads(self.credentials_json)
                    else:
                        credentials_info = self.credentials_json

                    credentials = service_account.Credentials.from_service_account_info(
                        credentials_info
                    )

                    self._client = bigquery.Client(
                        credentials=credentials,
                        project=self.project_id
                    )
                else:
                    # Use application default credentials
                    self._client = bigquery.Client(project=self.project_id)

                logger.info(f"Connected to BigQuery project: {self.project_id}")

            except Exception as e:
                raise ConnectionError(f"Failed to connect to BigQuery: {str(e)}")

        return self._client

    def test(self) -> ConnectionTestResult:
        """
        Test BigQuery connection.

        Returns:
            ConnectionTestResult with success status and project info
        """
        try:
            client = self._get_client()

            # Try to access the dataset
            dataset_ref = client.dataset(self.dataset_id)
            dataset = client.get_dataset(dataset_ref)

            # List tables to verify access
            tables = list(client.list_tables(dataset))

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to BigQuery dataset: {self.dataset_id}",
                details={
                    'project_id': self.project_id,
                    'dataset_id': self.dataset_id,
                    'location': dataset.location,
                    'tables_count': len(tables)
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

    def discover(self) -> DiscoveryResult:
        """
        Discover BigQuery tables and schemas.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            client = self._get_client()
            dataset_ref = client.dataset(self.dataset_id)

            # Get all tables in the dataset
            tables = list(client.list_tables(dataset_ref))
            streams = []
            schemas = {}

            for table_item in tables:
                table_ref = dataset_ref.table(table_item.table_id)
                table = client.get_table(table_ref)

                # Build JSON schema from BigQuery schema
                properties = {}
                required = []

                for field in table.schema:
                    json_type = self._map_bq_type(field.field_type)

                    if field.mode == 'REQUIRED':
                        properties[field.name] = {'type': json_type}
                        required.append(field.name)
                    elif field.mode == 'REPEATED':
                        properties[field.name] = {'type': 'array', 'items': {'type': json_type}}
                    else:  # NULLABLE
                        properties[field.name] = {'type': [json_type, 'null']}

                stream = {
                    'name': table.table_id,
                    'namespace': self.dataset_id,
                    'metadata': {
                        'row_count': table.num_rows,
                        'size_bytes': table.num_bytes,
                        'table_type': table.table_type
                    }
                }

                schema = {
                    'type': 'object',
                    'properties': properties,
                    'required': required
                }

                streams.append(stream)
                schemas[table.table_id] = schema

            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover BigQuery schemas: {str(e)}")

    def _map_bq_type(self, bq_type: str) -> str:
        """Map BigQuery data type to JSON schema type."""
        type_mapping = {
            'STRING': 'string',
            'BYTES': 'string',
            'INTEGER': 'number',
            'INT64': 'number',
            'FLOAT': 'number',
            'FLOAT64': 'number',
            'NUMERIC': 'number',
            'BIGNUMERIC': 'number',
            'BOOLEAN': 'boolean',
            'BOOL': 'boolean',
            'TIMESTAMP': 'string',
            'DATE': 'string',
            'TIME': 'string',
            'DATETIME': 'string',
            'GEOGRAPHY': 'string',
            'RECORD': 'object',
            'STRUCT': 'object'
        }

        return type_mapping.get(bq_type.upper(), 'string')

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a BigQuery table.

        Args:
            stream: Table name
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            client = self._get_client()

            # Build query
            query = f"SELECT * FROM `{self.project_id}.{self.dataset_id}.{stream}`"

            # Add WHERE clause for incremental sync
            if state and stream in state:
                bookmark = state[stream]
                if 'last_modified' in bookmark:
                    query += f" WHERE modified_at > TIMESTAMP('{bookmark['last_modified']}')"

            # Execute query
            query_job = client.query(query)

            # Iterate over results
            for row in query_job:
                # Convert row to dict
                record = dict(row)

                # Convert datetime objects to ISO strings
                for key, value in record.items():
                    if isinstance(value, datetime):
                        record[key] = value.isoformat()

                yield RecordMessage(
                    stream=stream,
                    record=record,
                    time_extracted=datetime.utcnow()
                )

        except Exception as e:
            raise DataReadError(f"Failed to read from BigQuery table {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a BigQuery table using streaming inserts.

        Args:
            stream: Table name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Primary key columns (for deduplication)

        Returns:
            Write statistics
        """
        try:
            client = self._get_client()
            table_ref = client.dataset(self.dataset_id).table(stream)

            records_written = 0
            batch = []

            for record_msg in records:
                batch.append(record_msg.record)

                if len(batch) >= self.batch_size:
                    # Insert batch using streaming API
                    errors = client.insert_rows_json(table_ref, batch)

                    if errors:
                        logger.error(f"BigQuery insert errors: {errors}")
                        raise DataWriteError(f"Failed to insert rows: {errors}")

                    records_written += len(batch)
                    batch = []

            # Insert remaining records
            if batch:
                errors = client.insert_rows_json(table_ref, batch)

                if errors:
                    logger.error(f"BigQuery insert errors: {errors}")
                    raise DataWriteError(f"Failed to insert rows: {errors}")

                records_written += len(batch)

            return {
                'records_written': records_written,
                'stream': stream
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to BigQuery table {stream}: {str(e)}")

    def close(self):
        """Close BigQuery client."""
        if self._client:
            self._client.close()
            self._client = None


# Register metadata
ConnectorMetadata.register_metadata(
    'bigquery',
    name='Google BigQuery',
    description='Google Cloud data warehouse connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['project_id', 'dataset_id', 'credentials_json'],
    optional_config=['location']
)

"""
MongoDB connector implementation.

This connector provides source support for MongoDB databases,
including schema discovery and incremental syncs.
"""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
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


@register_connector('mongodb')
class MongoDBConnector(BaseConnector):
    """
    MongoDB NoSQL database connector.

    Supports:
    - Full collection syncs
    - Incremental syncs via timestamp/ID fields
    - Schema inference from document sampling
    - Connection string or individual parameters
    """

    def __init__(self, source: 'Source'):
        """
        Initialize MongoDB connector.

        Config options from Source model:
        - host: MongoDB host (can be connection string)
        - port: MongoDB port (default: 27017)
        - database: Database name
        - username: Username (optional)
        - password: Password (optional, encrypted)
        - config: Additional config (authSource, ssl, etc.)
        """
        super().__init__(source)

        # Check if host is a full connection string
        if source.host and source.host.startswith('mongodb'):
            self.connection_string = source.host
            self.database = source.database
        else:
            self.host = source.host or 'localhost'
            self.port = source.port or 27017
            self.database = source.database
            self.user = source.username
            self.password = source.get_password() if source.username else None

            # Build connection string
            auth_part = f"{self.user}:{self.password}@" if self.user and self.password else ""
            self.connection_string = f"mongodb://{auth_part}{self.host}:{self.port}"

        self.auth_source = self.config.get('authSource', 'admin')
        self.ssl_enabled = source.ssl
        self.sample_size = self.config.get('sample_size', 1000)

        self._client = None

    def _get_client(self):
        """Get or create MongoDB client."""
        if self._client is None:
            try:
                options = {
                    'serverSelectionTimeoutMS': self.config.get('connection_timeout', 30000),
                }

                if self.ssl_enabled:
                    options['ssl'] = True

                if self.auth_source:
                    options['authSource'] = self.auth_source

                self._client = MongoClient(self.connection_string, **options)

                # Force connection to verify it works
                self._client.server_info()

                logger.info(f"Connected to MongoDB database: {self.database}")

            except ServerSelectionTimeoutError as e:
                raise ConnectionError(f"Failed to connect to MongoDB (timeout): {str(e)}")
            except ConnectionFailure as e:
                raise ConnectionError(f"Failed to connect to MongoDB: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Unexpected error connecting to MongoDB: {str(e)}")

        return self._client

    def test(self) -> ConnectionTestResult:
        """
        Test MongoDB connection.

        Returns:
            ConnectionTestResult with success status and database info
        """
        try:
            client = self._get_client()

            # Get server info
            server_info = client.server_info()
            version = server_info.get('version', 'unknown')

            # List databases to verify access
            db = client[self.database]
            collections = db.list_collection_names()

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to MongoDB database: {self.database}",
                details={
                    'version': version,
                    'database': self.database,
                    'collections_count': len(collections)
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
        Discover MongoDB collections and infer schemas.

        Samples documents from each collection to infer field types.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            client = self._get_client()
            db = client[self.database]

            collection_names = db.list_collection_names()
            streams = []
            schemas = {}

            for collection_name in collection_names:
                # Skip system collections
                if collection_name.startswith('system.'):
                    continue

                collection = db[collection_name]

                # Get document count
                doc_count = collection.count_documents({})

                # Sample documents to infer schema
                sample = list(collection.find().limit(self.sample_size))

                # Infer schema from sample
                inferred_schema = self._infer_schema(sample)

                # Build stream metadata
                stream = {
                    'name': collection_name,
                    'namespace': self.database,
                    'metadata': {
                        'document_count': doc_count,
                        'sample_size': len(sample)
                    }
                }

                streams.append(stream)
                schemas[collection_name] = inferred_schema

            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover MongoDB schemas: {str(e)}")
        finally:
            self.close()

    def _infer_schema(self, documents: List[Dict]) -> Dict[str, Any]:
        """
        Infer JSON schema from a sample of documents.

        Args:
            documents: List of MongoDB documents

        Returns:
            JSON schema dictionary
        """
        if not documents:
            return {
                'type': 'object',
                'properties': {},
                'additionalProperties': True
            }

        # Collect all field names and types
        field_types = {}

        for doc in documents:
            for field, value in doc.items():
                if field not in field_types:
                    field_types[field] = set()

                field_types[field].add(type(value).__name__)

        # Build schema properties
        properties = {}
        for field, types in field_types.items():
            # Convert Python types to JSON schema types
            json_types = []
            for py_type in types:
                if py_type in ('int', 'float'):
                    json_types.append('number')
                elif py_type == 'str':
                    json_types.append('string')
                elif py_type == 'bool':
                    json_types.append('boolean')
                elif py_type == 'list':
                    json_types.append('array')
                elif py_type == 'dict':
                    json_types.append('object')
                elif py_type == 'NoneType':
                    json_types.append('null')
                else:
                    json_types.append('string')

            # Use first type or array if multiple
            properties[field] = {
                'type': json_types if len(json_types) > 1 else json_types[0] if json_types else 'string'
            }

        return {
            'type': 'object',
            'properties': properties,
            'additionalProperties': True
        }

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a MongoDB collection.

        Args:
            stream: Collection name
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            client = self._get_client()
            db = client[self.database]
            collection = db[stream]

            # Build query based on state (for incremental sync)
            query = {}
            if state and stream in state:
                bookmark = state[stream]
                if 'last_modified' in bookmark:
                    query['modified_at'] = {'$gt': bookmark['last_modified']}
                elif 'last_id' in bookmark:
                    query['_id'] = {'$gt': bookmark['last_id']}

            # Read documents in batches
            cursor = collection.find(query).batch_size(self.batch_size)

            for doc in cursor:
                # Convert ObjectId to string
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])

                # Convert datetime objects to ISO strings
                for key, value in doc.items():
                    if isinstance(value, datetime):
                        doc[key] = value.isoformat()

                yield RecordMessage(
                    stream=stream,
                    record=doc,
                    time_extracted=datetime.utcnow()
                )

        except Exception as e:
            raise DataReadError(f"Failed to read from MongoDB collection {stream}: {str(e)}")
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
        Write data to a MongoDB collection.

        Args:
            stream: Collection name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Fields to use for upsert

        Returns:
            Write statistics
        """
        try:
            client = self._get_client()
            db = client[self.database]
            collection = db[stream]

            records_written = 0
            batch = []

            for record_msg in records:
                record = record_msg.record
                batch.append(record)

                if len(batch) >= self.batch_size:
                    # Insert batch
                    if key_properties:
                        # Upsert using key properties
                        for doc in batch:
                            filter_doc = {k: doc[k] for k in key_properties if k in doc}
                            collection.replace_one(filter_doc, doc, upsert=True)
                    else:
                        # Simple insert
                        collection.insert_many(batch, ordered=False)

                    records_written += len(batch)
                    batch = []

            # Insert remaining records
            if batch:
                if key_properties:
                    for doc in batch:
                        filter_doc = {k: doc[k] for k in key_properties if k in doc}
                        collection.replace_one(filter_doc, doc, upsert=True)
                else:
                    collection.insert_many(batch, ordered=False)

                records_written += len(batch)

            return {
                'records_written': records_written,
                'stream': stream
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to MongoDB collection {stream}: {str(e)}")
        finally:
            self.close()

    def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None


# Register metadata
ConnectorMetadata.register_metadata(
    'mongodb',
    name='MongoDB',
    description='NoSQL document database connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['host', 'database'],
    optional_config=['username', 'password', 'authSource', 'ssl']
)

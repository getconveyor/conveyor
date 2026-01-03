"""
Salesforce connector implementation.

This connector provides support for accessing Salesforce CRM data via the REST API.
"""

from simple_salesforce import Salesforce, SalesforceAuthenticationFailed, SalesforceExpiredSession
from simple_salesforce.exceptions import SalesforceError
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
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('salesforce')
class SalesforceConnector(BaseConnector):
    """
    Salesforce CRM connector.

    Supports:
    - Reading standard and custom objects
    - SOQL queries
    - Bulk API for large data sets
    - OAuth 2.0 authentication
    - Incremental syncs via SystemModstamp
    """

    def __init__(self, source: 'Source'):
        """
        Initialize Salesforce connector.

        Config options from Source model:
        - username: Salesforce username
        - password: Salesforce password + security token (encrypted)
        - config: Additional config (domain, api_version, client_id, client_secret)
        """
        super().__init__(source)

        self.username = source.username
        self.password = source.get_password()

        # OAuth credentials (if using OAuth instead of password)
        self.client_id = self.config.get('client_id')
        self.client_secret = self.config.get('client_secret')
        self.access_token = self.config.get('access_token')
        self.instance_url = self.config.get('instance_url')

        # Salesforce domain (login or test)
        self.domain = self.config.get('domain', 'login')  # login or test (for sandbox)
        self.api_version = self.config.get('api_version', '57.0')

        self._client = None

    def _get_client(self):
        """Get or create Salesforce client."""
        if self._client is None:
            try:
                if self.access_token and self.instance_url:
                    # Use OAuth access token
                    self._client = Salesforce(
                        instance_url=self.instance_url,
                        session_id=self.access_token,
                        version=self.api_version
                    )
                elif self.username and self.password:
                    # Use username/password authentication
                    # Note: password should include security token appended
                    self._client = Salesforce(
                        username=self.username,
                        password=self.password,
                        domain=self.domain,
                        version=self.api_version
                    )
                else:
                    raise ConnectionError("No valid Salesforce credentials provided")

                logger.info(f"Connected to Salesforce")

            except SalesforceAuthenticationFailed as e:
                raise ConnectionError(f"Salesforce authentication failed: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Failed to connect to Salesforce: {str(e)}")

        return self._client

    def test(self) -> ConnectionTestResult:
        """
        Test Salesforce connection.

        Returns:
            ConnectionTestResult with success status and org info
        """
        try:
            client = self._get_client()

            # Query org info
            org_info = client.query("SELECT Id, Name, OrganizationType FROM Organization LIMIT 1")

            if org_info['totalSize'] > 0:
                org = org_info['records'][0]

                return ConnectionTestResult(
                    success=True,
                    message=f"Successfully connected to Salesforce: {org['Name']}",
                    details={
                        'org_name': org['Name'],
                        'org_type': org['OrganizationType'],
                        'api_version': self.api_version,
                        'instance_url': client.sf_instance
                    }
                )
            else:
                return ConnectionTestResult(
                    success=True,
                    message="Successfully connected to Salesforce",
                    details={
                        'api_version': self.api_version,
                        'instance_url': client.sf_instance
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
        Discover Salesforce objects (standard and custom).

        Returns:
            DiscoveryResult with streams (objects) and schemas
        """
        try:
            client = self._get_client()

            # Get all objects
            describe = client.describe()

            streams = []
            schemas = {}

            for sobject in describe['sobjects']:
                # Skip non-queryable objects
                if not sobject['queryable']:
                    continue

                object_name = sobject['name']

                # Get detailed object description
                obj_describe = getattr(client, object_name).describe()

                # Build JSON schema from fields
                properties = {}
                required = []

                for field in obj_describe['fields']:
                    field_name = field['name']
                    field_type = self._map_salesforce_type(field['type'])

                    if field['nillable']:
                        properties[field_name] = {'type': [field_type, 'null']}
                    else:
                        properties[field_name] = {'type': field_type}
                        if not field['defaultedOnCreate']:
                            required.append(field_name)

                stream = {
                    'name': object_name,
                    'namespace': 'salesforce',
                    'metadata': {
                        'label': sobject['label'],
                        'custom': sobject['custom'],
                        'createable': sobject['createable'],
                        'updateable': sobject['updateable'],
                        'deletable': sobject['deletable']
                    }
                }

                schema = {
                    'type': 'object',
                    'properties': properties,
                    'required': required
                }

                streams.append(stream)
                schemas[object_name] = schema

            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover Salesforce objects: {str(e)}")

    def _map_salesforce_type(self, sf_type: str) -> str:
        """Map Salesforce field type to JSON schema type."""
        type_map = {
            'string': 'string',
            'textarea': 'string',
            'email': 'string',
            'phone': 'string',
            'url': 'string',
            'id': 'string',
            'reference': 'string',
            'picklist': 'string',
            'multipicklist': 'string',
            'int': 'number',
            'double': 'number',
            'currency': 'number',
            'percent': 'number',
            'boolean': 'boolean',
            'date': 'string',
            'datetime': 'string',
            'time': 'string',
            'base64': 'string',
            'address': 'object',
            'location': 'object'
        }

        return type_map.get(sf_type.lower(), 'string')

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a Salesforce object using SOQL.

        Args:
            stream: Object name (e.g., 'Account', 'Contact')
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            client = self._get_client()

            # Build SOQL query
            fields = list(schema['properties'].keys())

            # Limit fields to avoid query limits
            if len(fields) > 100:
                # For large schemas, query essential fields + Id
                essential_fields = ['Id', 'Name', 'CreatedDate', 'LastModifiedDate', 'SystemModstamp']
                fields = [f for f in fields if f in essential_fields]

            field_list = ', '.join(fields)
            query = f"SELECT {field_list} FROM {stream}"

            # Add WHERE clause for incremental sync
            if state and stream in state:
                bookmark = state[stream]
                if 'last_modified' in bookmark:
                    query += f" WHERE SystemModstamp > {bookmark['last_modified']}"

            # Add ORDER BY for consistent pagination
            query += " ORDER BY SystemModstamp ASC"

            # Execute query
            result = client.query_all(query)

            for record in result['records']:
                # Remove Salesforce metadata
                if 'attributes' in record:
                    del record['attributes']

                yield RecordMessage(
                    stream=stream,
                    record=record,
                    time_extracted=datetime.utcnow()
                )

        except SalesforceExpiredSession:
            # Try to refresh and retry
            self._client = None
            raise DataReadError("Salesforce session expired. Please reconnect.")
        except SalesforceError as e:
            raise DataReadError(f"Salesforce API error reading {stream}: {str(e)}")
        except Exception as e:
            raise DataReadError(f"Failed to read from Salesforce object {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a Salesforce object using REST API.

        Args:
            stream: Object name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Fields to use for upsert (typically 'Id' or external ID)

        Returns:
            Write statistics
        """
        try:
            client = self._get_client()

            records_written = 0
            errors = []

            for record_msg in records:
                record = record_msg.record

                try:
                    if 'Id' in record and record['Id']:
                        # Update existing record
                        record_id = record.pop('Id')
                        sobject = getattr(client, stream)
                        sobject.update(record_id, record)
                        records_written += 1
                    else:
                        # Create new record
                        sobject = getattr(client, stream)
                        result = sobject.create(record)

                        if result['success']:
                            records_written += 1
                        else:
                            errors.append({
                                'record': record,
                                'errors': result.get('errors', [])
                            })

                except SalesforceError as e:
                    errors.append({
                        'record': record,
                        'error': str(e)
                    })

            if errors:
                logger.warning(f"Encountered {len(errors)} errors writing to Salesforce")

            return {
                'records_written': records_written,
                'stream': stream,
                'errors': errors[:10]  # Return first 10 errors
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to Salesforce object {stream}: {str(e)}")

    def close(self):
        """Close Salesforce connection."""
        self._client = None


# Register metadata
ConnectorMetadata.register_metadata(
    'salesforce',
    name='Salesforce',
    description='Salesforce CRM connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['username', 'password'],
    optional_config=['client_id', 'client_secret', 'domain', 'api_version', 'access_token', 'instance_url']
)

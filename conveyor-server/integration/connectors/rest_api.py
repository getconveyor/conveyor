"""
REST API connector implementation.

This connector provides source support for RESTful HTTP APIs with various
authentication methods, pagination strategies, and rate limiting.
"""

import requests
import time
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, urlunparse
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
from integration.singer.state import StateManager
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('rest_api')
class RESTAPIConnector(BaseConnector):
    """
    REST API connector for HTTP data sources.

    Supports:
    - Multiple authentication methods (API key, Bearer token, Basic Auth, OAuth2)
    - Pagination strategies (offset, cursor, page-based, link header)
    - Rate limiting with retry/backoff
    - Custom headers
    - JSON path extraction for nested data
    - Request throttling

    Note: This is a source-only connector (read-only).
    """

    def __init__(self, connection: 'Connection'):
        """
        Initialize REST API connector.

        Config options:
        - base_url: Base API URL
        - auth_type: Authentication type (api_key, bearer, basic, oauth2, none)
        - api_key: API key (for api_key auth)
        - api_key_header: Header name for API key (default: 'X-API-Key')
        - bearer_token: Bearer token (for bearer auth)
        - username: Username (for basic auth)
        - password: Password (for basic auth)
        - headers: Additional custom headers (dict)
        - pagination_type: Pagination strategy (offset, cursor, page, link, none)
        - pagination_param: Query param for pagination (default: 'offset' or 'page')
        - page_size: Records per page (default: 100)
        - page_size_param: Query param for page size (default: 'limit')
        - data_path: JSON path to extract records (e.g., 'data.items')
        - rate_limit_calls: Max calls per rate_limit_period
        - rate_limit_period: Period in seconds for rate limiting
        - timeout: Request timeout in seconds (default: 30)
        """
        super().__init__(connection)

        self.base_url = self.config.get('base_url', '').rstrip('/')
        self.auth_type = self.config.get('auth_type', 'none')
        self.timeout = self.config.get('timeout', 30)

        # Authentication
        self.api_key = self.config.get('api_key')
        self.api_key_header = self.config.get('api_key_header', 'X-API-Key')
        self.bearer_token = self.config.get('bearer_token')
        self.username = self.config.get('username')
        self.password = connection.get_password() if self.auth_type == 'basic' else None

        # Custom headers
        self.custom_headers = self.config.get('headers', {})

        # Pagination
        self.pagination_type = self.config.get('pagination_type', 'offset')
        self.pagination_param = self.config.get('pagination_param', 'offset')
        self.page_size = self.config.get('page_size', 100)
        self.page_size_param = self.config.get('page_size_param', 'limit')
        self.cursor_path = self.config.get('cursor_path', 'next_cursor')
        self.data_path = self.config.get('data_path', '')  # e.g., 'data.items'

        # Rate limiting
        self.rate_limit_calls = self.config.get('rate_limit_calls')
        self.rate_limit_period = self.config.get('rate_limit_period', 60)
        self._request_times = []

        # Session for connection pooling
        self._session = None

    def _get_session(self) -> requests.Session:
        """Get or create HTTP session."""
        if self._session is None:
            self._session = requests.Session()

            # Set up authentication
            if self.auth_type == 'api_key' and self.api_key:
                self._session.headers[self.api_key_header] = self.api_key
            elif self.auth_type == 'bearer' and self.bearer_token:
                self._session.headers['Authorization'] = f'Bearer {self.bearer_token}'
            elif self.auth_type == 'basic' and self.username and self.password:
                self._session.auth = (self.username, self.password)

            # Add custom headers
            if self.custom_headers:
                self._session.headers.update(self.custom_headers)

            # Set default headers
            self._session.headers['User-Agent'] = 'Conveyor-ETL/1.0'
            self._session.headers['Accept'] = 'application/json'

        return self._session

    def _rate_limit_check(self):
        """Check and enforce rate limiting."""
        if not self.rate_limit_calls:
            return

        now = time.time()

        # Remove old request times outside the window
        self._request_times = [
            t for t in self._request_times
            if now - t < self.rate_limit_period
        ]

        # Check if we're at the limit
        if len(self._request_times) >= self.rate_limit_calls:
            # Calculate how long to wait
            oldest_request = self._request_times[0]
            sleep_time = self.rate_limit_period - (now - oldest_request)

            if sleep_time > 0:
                logger.info(f"Rate limit reached, sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)

        # Record this request
        self._request_times.append(time.time())

    def _make_request(
        self,
        method: str,
        url: str,
        params: Optional[Dict] = None,
        retry_count: int = 0
    ) -> requests.Response:
        """
        Make HTTP request with rate limiting and retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL
            params: Query parameters
            retry_count: Current retry attempt

        Returns:
            Response object

        Raises:
            ConnectionError: If request fails
        """
        self._rate_limit_check()

        session = self._get_session()

        try:
            response = session.request(
                method=method,
                url=url,
                params=params,
                timeout=self.timeout
            )

            # Handle rate limiting (429)
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', self.retry_delay))
                logger.warning(f"Rate limited by server, waiting {retry_after} seconds")
                time.sleep(retry_after)
                return self._make_request(method, url, params, retry_count)

            # Retry on server errors
            if response.status_code >= 500:
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay * (2 ** retry_count)  # Exponential backoff
                    logger.warning(
                        f"Server error {response.status_code}, "
                        f"retrying in {wait_time} seconds (attempt {retry_count + 1}/{self.max_retries})"
                    )
                    time.sleep(wait_time)
                    return self._make_request(method, url, params, retry_count + 1)

            response.raise_for_status()
            return response

        except requests.exceptions.Timeout:
            raise ConnectionError(f"Request timeout after {self.timeout} seconds")
        except requests.exceptions.ConnectionError as e:
            raise ConnectionError(f"Connection error: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"HTTP request failed: {str(e)}")

    def _extract_data(self, response_data: Any) -> List[Dict]:
        """
        Extract data from response using configured data path.

        Args:
            response_data: Response JSON data

        Returns:
            List of record dictionaries
        """
        if not self.data_path:
            # No path specified - assume response is the data
            if isinstance(response_data, list):
                return response_data
            elif isinstance(response_data, dict):
                return [response_data]
            else:
                return []

        # Navigate the JSON path
        current = response_data
        for key in self.data_path.split('.'):
            if isinstance(current, dict):
                current = current.get(key, [])
            else:
                return []

        # Ensure it's a list
        if isinstance(current, list):
            return current
        elif isinstance(current, dict):
            return [current]
        else:
            return []

    def _get_next_cursor(self, response_data: Any) -> Optional[str]:
        """
        Extract next cursor from response.

        Args:
            response_data: Response JSON data

        Returns:
            Next cursor value or None
        """
        if not self.cursor_path:
            return None

        current = response_data
        for key in self.cursor_path.split('.'):
            if isinstance(current, dict):
                current = current.get(key)
            else:
                return None

        return current

    def test(self) -> ConnectionTestResult:
        """
        Test REST API connection.

        Returns:
            ConnectionTestResult with success status
        """
        try:
            # Try to make a simple request to the base URL
            response = self._make_request('GET', self.base_url)

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to API: {self.base_url}",
                details={
                    'base_url': self.base_url,
                    'status_code': response.status_code,
                    'auth_type': self.auth_type
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
        Discover API endpoints.

        Note: REST APIs don't have automatic schema discovery.
        Streams and schemas must be manually configured.

        Returns:
            DiscoveryResult with empty streams (manual configuration required)
        """
        logger.warning(
            "REST API connector does not support automatic schema discovery. "
            "Please configure streams manually in the pipeline config."
        )

        return DiscoveryResult(
            streams=[],
            schemas={}
        )

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a REST API endpoint.

        Args:
            stream: Endpoint path (relative to base_url)
            schema: JSON schema for the data
            state: Previous state for incremental sync

        Yields:
            RecordMessage objects for each record
        """
        try:
            # Build full URL
            url = urljoin(self.base_url, stream)

            # Initialize pagination
            page_num = 0
            offset = 0
            cursor = None
            has_more = True
            total_count = 0

            logger.info(f"Starting to read from {url}")

            while has_more:
                # Build query params
                params = {}

                if self.pagination_type == 'offset':
                    params[self.pagination_param] = offset
                    params[self.page_size_param] = self.page_size
                elif self.pagination_type == 'page':
                    params[self.pagination_param] = page_num
                    params[self.page_size_param] = self.page_size
                elif self.pagination_type == 'cursor' and cursor:
                    params[self.pagination_param] = cursor
                    params[self.page_size_param] = self.page_size

                # Make request
                response = self._make_request('GET', url, params)
                response_data = response.json()

                # Extract records from response
                records = self._extract_data(response_data)

                if not records:
                    has_more = False
                    break

                # Yield records
                for record in records:
                    yield RecordMessage(
                        stream=stream,
                        record=record,
                        time_extracted=datetime.utcnow()
                    )
                    total_count += 1

                # Handle pagination
                if self.pagination_type == 'offset':
                    offset += len(records)
                    has_more = len(records) >= self.page_size
                elif self.pagination_type == 'page':
                    page_num += 1
                    has_more = len(records) >= self.page_size
                elif self.pagination_type == 'cursor':
                    cursor = self._get_next_cursor(response_data)
                    has_more = cursor is not None
                elif self.pagination_type == 'link':
                    # Check for Link header
                    link_header = response.headers.get('Link', '')
                    has_more = 'rel="next"' in link_header
                    # TODO: Parse Link header for next URL
                else:
                    # No pagination
                    has_more = False

                logger.debug(f"Read page with {len(records)} records from {stream}")

            logger.info(f"Finished reading {total_count} records from {stream}")

        except Exception as e:
            raise DataReadError(f"Failed to read from API endpoint {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write operation not supported for REST API connector.

        Raises:
            DataWriteError: Always raises as REST APIs are read-only sources
        """
        raise DataWriteError(
            "REST API connector is a source-only connector and does not support write operations. "
            "Use a database or file connector as the destination."
        )

    def close(self):
        """Close HTTP session."""
        if self._session:
            self._session.close()
            self._session = None
            logger.debug("Closed REST API session")


# Register connector metadata
ConnectorMetadata.register_metadata(
    'rest_api',
    name='REST API',
    description='Generic REST API connector with authentication and pagination support',
    source=True,
    destination=False,  # Read-only connector
    incremental_support=False,  # Could be implemented with cursor-based pagination
    required_config=['base_url'],
    optional_config=[
        'auth_type', 'api_key', 'api_key_header', 'bearer_token',
        'username', 'password', 'headers',
        'pagination_type', 'pagination_param', 'page_size', 'page_size_param',
        'data_path', 'cursor_path',
        'rate_limit_calls', 'rate_limit_period', 'timeout'
    ]
)

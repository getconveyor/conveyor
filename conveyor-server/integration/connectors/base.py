"""
Base connector framework for all data source/destination connectors.

This module defines the abstract interface that all connectors must implement.
Connectors are responsible for:
- Testing connections
- Discovering available schemas/tables
- Reading data from sources (with incremental sync support)
- Writing data to destinations
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Iterator, List
from dataclasses import dataclass
from datetime import datetime

from integration.singer.messages import (
    SchemaMessage,
    RecordMessage,
    StateMessage,
    LogMessage,
    MetricMessage,
    LogLevel
)
from integration.exceptions import (
    ConnectorError,
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)


@dataclass
class ConnectionTestResult:
    """Result of a connection test."""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class DiscoveryResult:
    """Result of schema discovery."""
    streams: List[Dict[str, Any]]  # List of available tables/collections
    schemas: Dict[str, Dict[str, Any]]  # JSON schemas for each stream
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class BaseConnector(ABC):
    """
    Abstract base class for all connectors.

    Connectors bridge the gap between the Singer protocol and specific
    data sources/destinations (databases, APIs, files, etc.).

    Each connector must implement four core methods:
    - test(): Verify connection credentials
    - discover(): Find available tables/streams and their schemas
    - read(): Extract data from source
    - write(): Load data to destination
    """

    def __init__(self, connection: 'Connection'):
        """
        Initialize connector with a Connection model instance.

        Args:
            connection: Django Connection model instance with config/credentials
        """
        self.connection = connection
        self.config = connection.config or {}
        self.connector_type = connection.connector_type

        # Performance settings
        self.batch_size = self.config.get('batch_size', 1000)
        self.max_retries = self.config.get('max_retries', 3)
        self.retry_delay = self.config.get('retry_delay', 5)

    @abstractmethod
    def test(self) -> ConnectionTestResult:
        """
        Test the connection to verify credentials and connectivity.

        Returns:
            ConnectionTestResult with success status and details

        Raises:
            ConnectionError: If connection test fails

        Example:
            >>> connector = PostgreSQLConnector(connection)
            >>> result = connector.test()
            >>> result.success
            True
        """
        pass

    @abstractmethod
    def discover(self) -> DiscoveryResult:
        """
        Discover available streams (tables/collections) and their schemas.

        Returns:
            DiscoveryResult containing list of streams and their JSON schemas

        Raises:
            SchemaDiscoveryError: If schema discovery fails

        Example:
            >>> result = connector.discover()
            >>> result.streams
            [{'name': 'users', 'namespace': 'public', ...}, ...]
        """
        pass

    @abstractmethod
    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a stream (table/collection).

        This method should yield RecordMessage objects for each row.
        For incremental syncs, use the state parameter to determine
        where to resume from.

        Args:
            stream: Name of the stream to read
            schema: JSON schema for the stream
            state: Previous state for incremental sync (bookmarks)

        Yields:
            RecordMessage objects containing data rows

        Raises:
            DataReadError: If reading data fails

        Example:
            >>> for record_msg in connector.read('users', schema, state):
            ...     print(record_msg.record)
            {'id': 1, 'name': 'John', 'email': 'john@example.com'}
        """
        pass

    @abstractmethod
    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a stream (table/collection).

        This method should consume RecordMessage objects and write them
        to the destination. If key_properties are provided, use them
        for upsert logic.

        Args:
            stream: Name of the stream to write to
            schema: JSON schema for the stream
            records: Iterator of RecordMessage objects
            key_properties: Primary key columns for upsert

        Returns:
            Dictionary with write statistics (records_written, etc.)

        Raises:
            DataWriteError: If writing data fails

        Example:
            >>> stats = connector.write('users', schema, records, ['id'])
            >>> stats['records_written']
            1000
        """
        pass

    def _log(self, level: LogLevel, message: str) -> LogMessage:
        """
        Create a log message.

        Args:
            level: Log level
            message: Log message

        Returns:
            LogMessage object
        """
        return LogMessage(level=level, message=message)

    def _metric(self, metric: str, value: Any, tags: Optional[Dict[str, str]] = None) -> MetricMessage:
        """
        Create a metric message.

        Args:
            metric: Metric name
            value: Metric value
            tags: Additional tags

        Returns:
            MetricMessage object
        """
        return MetricMessage(metric=metric, value=value, tags=tags or {})

    def get_connection_string(self) -> str:
        """
        Get a connection string (if applicable).

        Override this method in connectors that use connection strings.

        Returns:
            Connection string or empty string
        """
        return ""

    def close(self):
        """
        Close any open connections or resources.

        Override this method if your connector maintains persistent connections.
        """
        pass

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensures cleanup."""
        self.close()
        return False

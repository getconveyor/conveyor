"""
Singer protocol message implementations.

This module implements the core message types used in the Singer specification:
- SCHEMA: Announces the structure of data records
- RECORD: Contains actual data rows
- STATE: Tracks incremental sync progress (bookmarks)
- LOG: Debug and informational messages
- METRIC: Performance and execution metrics

Based on the Singer specification: https://github.com/singer-io/getting-started
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime
import json


class MessageType(Enum):
    """Types of messages in the Singer protocol"""
    SCHEMA = "SCHEMA"
    RECORD = "RECORD"
    STATE = "STATE"
    LOG = "LOG"
    METRIC = "METRIC"


class LogLevel(Enum):
    """Log levels for LOG messages"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class SingerMessage:
    """
    Base class for all Singer messages.

    All messages can be serialized to JSON for transmission between
    connectors and for storage.
    """

    def __init__(self, message_type: MessageType):
        self.type = message_type
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert message to dictionary representation.

        Returns:
            Dict with message data
        """
        raise NotImplementedError("Subclasses must implement to_dict()")

    def to_json(self) -> str:
        """
        Convert message to JSON string.

        Returns:
            JSON string representation
        """
        return json.dumps(self.to_dict(), default=str)

    def __str__(self) -> str:
        return self.to_json()


class SchemaMessage(SingerMessage):
    """
    SCHEMA message announces the structure of records.

    Describes the columns, data types, and constraints for a stream of data.
    Uses JSON Schema format for maximum compatibility.

    Example:
        {
            "type": "SCHEMA",
            "stream": "users",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "created_at": {"type": "string", "format": "date-time"}
                },
                "required": ["id", "email"]
            },
            "key_properties": ["id"],
            "bookmark_properties": ["created_at"]
        }
    """

    def __init__(
        self,
        stream: str,
        schema: Dict[str, Any],
        key_properties: List[str],
        bookmark_properties: Optional[List[str]] = None
    ):
        """
        Initialize a SCHEMA message.

        Args:
            stream: Name of the data stream (table/collection name)
            schema: JSON Schema describing the data structure
            key_properties: List of column names that form the primary key
            bookmark_properties: List of columns used for incremental sync (e.g., updated_at)
        """
        super().__init__(MessageType.SCHEMA)
        self.stream = stream
        self.schema = schema
        self.key_properties = key_properties
        self.bookmark_properties = bookmark_properties or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "SCHEMA",
            "stream": self.stream,
            "schema": self.schema,
            "key_properties": self.key_properties,
            "bookmark_properties": self.bookmark_properties
        }


class RecordMessage(SingerMessage):
    """
    RECORD message contains actual data.

    Each record represents a single row from the source data stream.
    Records should conform to the schema announced in the SCHEMA message.

    Example:
        {
            "type": "RECORD",
            "stream": "users",
            "record": {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com",
                "created_at": "2025-01-15T10:30:00Z"
            },
            "time_extracted": "2025-01-15T12:00:00Z"
        }
    """

    def __init__(
        self,
        stream: str,
        record: Dict[str, Any],
        time_extracted: Optional[datetime] = None
    ):
        """
        Initialize a RECORD message.

        Args:
            stream: Name of the data stream this record belongs to
            record: Dictionary containing the actual data
            time_extracted: When this record was extracted from the source
        """
        super().__init__(MessageType.RECORD)
        self.stream = stream
        self.record = record
        self.time_extracted = time_extracted or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "RECORD",
            "stream": self.stream,
            "record": self.record,
            "time_extracted": self.time_extracted.isoformat()
        }


class StateMessage(SingerMessage):
    """
    STATE message tracks incremental sync progress.

    Contains bookmarks indicating where the sync left off, enabling
    incremental syncs that only fetch new/changed data.

    The state is persisted and passed back to the tap on the next sync.

    Example:
        {
            "type": "STATE",
            "value": {
                "bookmarks": {
                    "users": {
                        "updated_at": "2025-01-15T12:00:00Z",
                        "last_id": 1000
                    },
                    "orders": {
                        "created_at": "2025-01-15T11:30:00Z"
                    }
                }
            }
        }
    """

    def __init__(self, value: Dict[str, Any]):
        """
        Initialize a STATE message.

        Args:
            value: Dictionary containing bookmark state for streams
        """
        super().__init__(MessageType.STATE)
        self.value = value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "STATE",
            "value": self.value
        }

    def get_bookmark(self, stream: str) -> Optional[Dict[str, Any]]:
        """
        Get bookmark for a specific stream.

        Args:
            stream: Name of the stream

        Returns:
            Bookmark dictionary or None
        """
        return self.value.get("bookmarks", {}).get(stream)

    def set_bookmark(self, stream: str, bookmark: Dict[str, Any]):
        """
        Set bookmark for a specific stream.

        Args:
            stream: Name of the stream
            bookmark: Bookmark data to store
        """
        if "bookmarks" not in self.value:
            self.value["bookmarks"] = {}
        self.value["bookmarks"][stream] = bookmark


class LogMessage(SingerMessage):
    """
    LOG message for logging and debugging.

    Used to communicate informational messages, warnings, and errors
    during pipeline execution.

    Example:
        {
            "type": "LOG",
            "level": "INFO",
            "message": "Starting sync for stream users",
            "timestamp": "2025-01-15T12:00:00Z"
        }
    """

    def __init__(self, level: LogLevel, message: str):
        """
        Initialize a LOG message.

        Args:
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            message: Log message text
        """
        super().__init__(MessageType.LOG)
        self.level = level
        self.message = message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "LOG",
            "level": self.level.value,
            "message": self.message,
            "timestamp": self.timestamp.isoformat()
        }


class MetricMessage(SingerMessage):
    """
    METRIC message for tracking pipeline metrics.

    Used to report performance metrics, progress, and statistics
    during pipeline execution.

    Example:
        {
            "type": "METRIC",
            "metric": "record_count",
            "value": 1000,
            "tags": {
                "stream": "users",
                "pipeline_id": "abc-123"
            },
            "timestamp": "2025-01-15T12:00:00Z"
        }
    """

    def __init__(
        self,
        metric: str,
        value: Any,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize a METRIC message.

        Args:
            metric: Name of the metric (e.g., "record_count", "bytes_processed")
            value: Metric value
            tags: Additional metadata tags
        """
        super().__init__(MessageType.METRIC)
        self.metric = metric
        self.value = value
        self.tags = tags or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "METRIC",
            "metric": self.metric,
            "value": self.value,
            "tags": self.tags,
            "timestamp": self.timestamp.isoformat()
        }


def parse_message(line: str) -> Optional[SingerMessage]:
    """
    Parse a JSON line into a Singer message object.

    Args:
        line: JSON string containing a Singer message

    Returns:
        Appropriate SingerMessage subclass or None if parsing fails

    Example:
        >>> msg = parse_message('{"type": "RECORD", "stream": "users", ...}')
        >>> isinstance(msg, RecordMessage)
        True
    """
    try:
        data = json.loads(line)
        msg_type = data.get("type")

        if msg_type == "SCHEMA":
            return SchemaMessage(
                stream=data["stream"],
                schema=data["schema"],
                key_properties=data["key_properties"],
                bookmark_properties=data.get("bookmark_properties", [])
            )
        elif msg_type == "RECORD":
            return RecordMessage(
                stream=data["stream"],
                record=data["record"],
                time_extracted=datetime.fromisoformat(data.get("time_extracted", datetime.utcnow().isoformat()))
            )
        elif msg_type == "STATE":
            return StateMessage(value=data["value"])
        elif msg_type == "LOG":
            return LogMessage(
                level=LogLevel[data["level"]],
                message=data["message"]
            )
        elif msg_type == "METRIC":
            return MetricMessage(
                metric=data["metric"],
                value=data["value"],
                tags=data.get("tags", {})
            )
        else:
            return None
    except (json.JSONDecodeError, KeyError, ValueError):
        return None

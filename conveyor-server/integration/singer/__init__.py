"""
Singer protocol implementation for Conveyor ETL engine.

This package provides the core Singer protocol message types and utilities
for schema mapping and state management.
"""

from integration.singer.messages import (
    MessageType,
    LogLevel,
    SingerMessage,
    SchemaMessage,
    RecordMessage,
    StateMessage,
    LogMessage,
    MetricMessage,
    parse_message
)
from integration.singer.schema import (
    DataType,
    TypeMapper,
    CatalogBuilder
)
from integration.singer.state import (
    StateManager,
    IncrementalSyncHelper,
    merge_states
)

__all__ = [
    # Messages
    'MessageType',
    'LogLevel',
    'SingerMessage',
    'SchemaMessage',
    'RecordMessage',
    'StateMessage',
    'LogMessage',
    'MetricMessage',
    'parse_message',
    # Schema
    'DataType',
    'TypeMapper',
    'CatalogBuilder',
    # State
    'StateManager',
    'IncrementalSyncHelper',
    'merge_states',
]

"""
State management for incremental sync operations.

This module provides utilities for managing pipeline state, enabling
incremental syncs that only process new or changed data since the last run.

State is persisted in the Pipeline model's config field and can track:
- Last synced timestamp
- Last synced ID
- Custom bookmarks per stream
"""

from typing import Dict, Any, Optional
from datetime import datetime
import json


class StateManager:
    """
    Manages state for incremental pipeline syncs.

    State is organized by stream, with each stream having its own bookmark.
    Bookmarks can track timestamps, IDs, or custom values.
    """

    def __init__(self, initial_state: Optional[Dict[str, Any]] = None):
        """
        Initialize state manager.

        Args:
            initial_state: Initial state dictionary (typically from previous run)

        Example:
            >>> state = StateManager({
            ...     "bookmarks": {
            ...         "users": {"updated_at": "2025-01-15T12:00:00Z"}
            ...     }
            ... })
        """
        self.state = initial_state or {"bookmarks": {}}

        # Ensure bookmarks key exists
        if "bookmarks" not in self.state:
            self.state["bookmarks"] = {}

    def get_bookmark(self, stream: str, key: str = None) -> Any:
        """
        Get bookmark value for a stream.

        Args:
            stream: Name of the stream (table/collection)
            key: Specific bookmark key (e.g., "updated_at", "last_id")
                 If None, returns entire bookmark dict

        Returns:
            Bookmark value or None if not found

        Example:
            >>> manager.get_bookmark("users", "updated_at")
            "2025-01-15T12:00:00Z"
        """
        stream_bookmark = self.state.get("bookmarks", {}).get(stream, {})

        if key is None:
            return stream_bookmark

        return stream_bookmark.get(key)

    def set_bookmark(self, stream: str, key: str, value: Any):
        """
        Set bookmark value for a stream.

        Args:
            stream: Name of the stream
            key: Bookmark key (e.g., "updated_at", "last_id")
            value: Bookmark value

        Example:
            >>> manager.set_bookmark("users", "updated_at", "2025-01-15T13:00:00Z")
        """
        if stream not in self.state["bookmarks"]:
            self.state["bookmarks"][stream] = {}

        self.state["bookmarks"][stream][key] = value

    def update_bookmark(self, stream: str, bookmark: Dict[str, Any]):
        """
        Update entire bookmark for a stream.

        Args:
            stream: Name of the stream
            bookmark: Complete bookmark dictionary

        Example:
            >>> manager.update_bookmark("users", {
            ...     "updated_at": "2025-01-15T13:00:00Z",
            ...     "last_id": 1000
            ... })
        """
        if stream not in self.state["bookmarks"]:
            self.state["bookmarks"][stream] = {}

        self.state["bookmarks"][stream].update(bookmark)

    def has_bookmark(self, stream: str) -> bool:
        """
        Check if a stream has any bookmarks.

        Args:
            stream: Name of the stream

        Returns:
            True if stream has bookmarks
        """
        return stream in self.state.get("bookmarks", {})

    def clear_bookmark(self, stream: str):
        """
        Clear all bookmarks for a stream.

        Args:
            stream: Name of the stream
        """
        if stream in self.state.get("bookmarks", {}):
            del self.state["bookmarks"][stream]

    def get_state(self) -> Dict[str, Any]:
        """
        Get complete state dictionary.

        Returns:
            State dictionary suitable for persistence
        """
        return self.state

    def to_json(self) -> str:
        """
        Convert state to JSON string.

        Returns:
            JSON string representation
        """
        return json.dumps(self.state, default=str)

    @classmethod
    def from_json(cls, json_str: str) -> 'StateManager':
        """
        Create StateManager from JSON string.

        Args:
            json_str: JSON string containing state

        Returns:
            New StateManager instance
        """
        state = json.loads(json_str) if json_str else {}
        return cls(state)


class IncrementalSyncHelper:
    """
    Helper utilities for building incremental sync queries.

    Provides methods to construct WHERE clauses and bookmark values
    for common incremental sync patterns.
    """

    @staticmethod
    def build_timestamp_filter(
        column_name: str,
        last_value: Optional[str],
        operator: str = ">"
    ) -> Optional[Dict[str, Any]]:
        """
        Build filter for timestamp-based incremental sync.

        Args:
            column_name: Name of the timestamp column
            last_value: Last synced timestamp (ISO format)
            operator: Comparison operator (default: ">")

        Returns:
            Filter dictionary or None if no last_value

        Example:
            >>> IncrementalSyncHelper.build_timestamp_filter(
            ...     "updated_at",
            ...     "2025-01-15T12:00:00Z"
            ... )
            {'column': 'updated_at', 'operator': '>', 'value': '2025-01-15T12:00:00Z'}
        """
        if not last_value:
            return None

        return {
            "column": column_name,
            "operator": operator,
            "value": last_value
        }

    @staticmethod
    def build_id_filter(
        column_name: str,
        last_id: Optional[int],
        operator: str = ">"
    ) -> Optional[Dict[str, Any]]:
        """
        Build filter for ID-based incremental sync.

        Args:
            column_name: Name of the ID column
            last_id: Last synced ID
            operator: Comparison operator (default: ">")

        Returns:
            Filter dictionary or None if no last_id

        Example:
            >>> IncrementalSyncHelper.build_id_filter("id", 1000)
            {'column': 'id', 'operator': '>', 'value': 1000}
        """
        if last_id is None:
            return None

        return {
            "column": column_name,
            "operator": operator,
            "value": last_id
        }

    @staticmethod
    def get_max_value(records: list, column_name: str) -> Optional[Any]:
        """
        Get maximum value for a column from a list of records.

        Useful for determining the bookmark value after processing a batch.

        Args:
            records: List of record dictionaries
            column_name: Column to find max value for

        Returns:
            Maximum value or None

        Example:
            >>> records = [
            ...     {"id": 1, "updated_at": "2025-01-15T12:00:00Z"},
            ...     {"id": 2, "updated_at": "2025-01-15T13:00:00Z"}
            ... ]
            >>> IncrementalSyncHelper.get_max_value(records, "updated_at")
            "2025-01-15T13:00:00Z"
        """
        if not records:
            return None

        values = [r.get(column_name) for r in records if column_name in r]
        return max(values) if values else None

    @staticmethod
    def extract_bookmark_from_batch(
        records: list,
        bookmark_columns: list
    ) -> Dict[str, Any]:
        """
        Extract bookmark values from a batch of records.

        Args:
            records: List of record dictionaries
            bookmark_columns: List of column names to extract

        Returns:
            Dictionary with max values for each bookmark column

        Example:
            >>> records = [
            ...     {"id": 1, "updated_at": "2025-01-15T12:00:00Z"},
            ...     {"id": 2, "updated_at": "2025-01-15T13:00:00Z"}
            ... ]
            >>> IncrementalSyncHelper.extract_bookmark_from_batch(
            ...     records,
            ...     ["id", "updated_at"]
            ... )
            {'id': 2, 'updated_at': '2025-01-15T13:00:00Z'}
        """
        bookmark = {}

        for column in bookmark_columns:
            max_val = IncrementalSyncHelper.get_max_value(records, column)
            if max_val is not None:
                bookmark[column] = max_val

        return bookmark


def merge_states(old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge two state dictionaries, preferring newer bookmarks.

    Args:
        old_state: Previous state
        new_state: New state to merge in

    Returns:
        Merged state dictionary

    Example:
        >>> old = {"bookmarks": {"users": {"last_id": 100}}}
        >>> new = {"bookmarks": {"users": {"last_id": 200}, "orders": {"last_id": 50}}}
        >>> merged = merge_states(old, new)
        >>> merged["bookmarks"]["users"]["last_id"]
        200
    """
    merged = {"bookmarks": {}}

    # Copy old bookmarks
    old_bookmarks = old_state.get("bookmarks", {})
    new_bookmarks = new_state.get("bookmarks", {})

    # Start with old bookmarks
    merged["bookmarks"] = old_bookmarks.copy()

    # Update with new bookmarks
    for stream, bookmark in new_bookmarks.items():
        if stream in merged["bookmarks"]:
            # Merge stream bookmarks
            merged["bookmarks"][stream].update(bookmark)
        else:
            # New stream
            merged["bookmarks"][stream] = bookmark

    return merged

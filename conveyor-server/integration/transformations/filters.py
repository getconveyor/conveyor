"""
Row filtering transformations.

This module provides transformations for filtering records based on conditions,
similar to SQL WHERE clauses.
"""

from typing import Dict, Any, Iterator, List, Optional, Callable
import re
from datetime import datetime
import logging

from integration.singer.messages import RecordMessage
from integration.exceptions import TransformationError

logger = logging.getLogger(__name__)


class RowFilter:
    """
    Transform that filters records based on conditions.

    Supports various operators: =, !=, >, <, >=, <=, IN, NOT IN, LIKE, IS NULL, IS NOT NULL

    Example:
        >>> conditions = [
        ...     {'column': 'status', 'operator': '=', 'value': 'active'},
        ...     {'column': 'age', 'operator': '>', 'value': 18}
        ... ]
        >>> filter = RowFilter(conditions, match_all=True)
        >>> for record in filter.transform(records):
        ...     print(record.record)
    """

    OPERATORS = {
        '=': lambda a, b: a == b,
        '==': lambda a, b: a == b,
        '!=': lambda a, b: a != b,
        '>': lambda a, b: a > b,
        '<': lambda a, b: a < b,
        '>=': lambda a, b: a >= b,
        '<=': lambda a, b: a <= b,
        'IN': lambda a, b: a in b,
        'NOT IN': lambda a, b: a not in b,
        'LIKE': lambda a, b: re.search(b.replace('%', '.*'), str(a)) is not None,
        'IS NULL': lambda a, b: a is None,
        'IS NOT NULL': lambda a, b: a is not None,
        'CONTAINS': lambda a, b: b in str(a),
        'STARTS WITH': lambda a, b: str(a).startswith(str(b)),
        'ENDS WITH': lambda a, b: str(a).endswith(str(b)),
    }

    def __init__(self, conditions: List[Dict[str, Any]], match_all: bool = True):
        """
        Initialize row filter.

        Args:
            conditions: List of condition dictionaries
                       Each condition has: column, operator, value (optional)
            match_all: If True, all conditions must match (AND).
                      If False, any condition can match (OR).

        Example conditions:
            [
                {'column': 'status', 'operator': '=', 'value': 'active'},
                {'column': 'age', 'operator': '>=', 'value': 18},
                {'column': 'email', 'operator': 'IS NOT NULL'}
            ]
        """
        self.conditions = conditions
        self.match_all = match_all

        # Validate conditions
        for condition in conditions:
            if 'column' not in condition:
                raise ValueError("Each condition must have a 'column' key")
            if 'operator' not in condition:
                raise ValueError("Each condition must have an 'operator' key")
            if condition['operator'] not in self.OPERATORS:
                raise ValueError(f"Unsupported operator: {condition['operator']}")

    def _evaluate_condition(self, record: Dict[str, Any], condition: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition against a record.

        Args:
            record: Record dictionary
            condition: Condition dictionary

        Returns:
            True if condition matches, False otherwise
        """
        column = condition['column']
        operator = condition['operator']
        expected_value = condition.get('value')

        # Get actual value from record
        actual_value = record.get(column)

        # Get operator function
        operator_func = self.OPERATORS[operator]

        try:
            # Special handling for NULL checks
            if operator in ('IS NULL', 'IS NOT NULL'):
                return operator_func(actual_value, None)

            # Handle IN and NOT IN with list values
            if operator in ('IN', 'NOT IN'):
                if not isinstance(expected_value, (list, tuple, set)):
                    expected_value = [expected_value]
                return operator_func(actual_value, expected_value)

            # Regular comparison
            return operator_func(actual_value, expected_value)

        except (TypeError, ValueError) as e:
            logger.warning(
                f"Error evaluating condition {condition} on value {actual_value}: {str(e)}"
            )
            return False

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by filtering based on conditions.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects that match the filter conditions
        """
        for record_msg in records:
            try:
                # Evaluate all conditions
                results = [
                    self._evaluate_condition(record_msg.record, condition)
                    for condition in self.conditions
                ]

                # Determine if record passes filter
                if self.match_all:
                    # AND logic - all conditions must be true
                    passes = all(results) if results else True
                else:
                    # OR logic - at least one condition must be true
                    passes = any(results) if results else True

                if passes:
                    yield record_msg

            except Exception as e:
                logger.error(f"Error filtering record: {str(e)}")
                raise TransformationError(f"Row filtering failed: {str(e)}")


class DuplicateFilter:
    """
    Transform that filters out duplicate records based on key columns.

    Example:
        >>> filter = DuplicateFilter(['id'])
        >>> for record in filter.transform(records):
        ...     print(record.record)  # Only unique records
    """

    def __init__(self, key_columns: List[str]):
        """
        Initialize duplicate filter.

        Args:
            key_columns: List of column names to use for duplicate detection
        """
        self.key_columns = key_columns
        self._seen_keys = set()

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by filtering out duplicates.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects without duplicates
        """
        for record_msg in records:
            try:
                # Build key tuple from key columns
                key = tuple(
                    record_msg.record.get(col)
                    for col in self.key_columns
                )

                # Check if we've seen this key before
                if key not in self._seen_keys:
                    self._seen_keys.add(key)
                    yield record_msg

            except Exception as e:
                logger.error(f"Error filtering duplicates: {str(e)}")
                raise TransformationError(f"Duplicate filtering failed: {str(e)}")

    def reset(self):
        """Reset the seen keys cache."""
        self._seen_keys.clear()


class SampleFilter:
    """
    Transform that samples records (takes every Nth record or random sample).

    Example:
        >>> filter = SampleFilter(sample_rate=0.1)  # 10% sample
        >>> for record in filter.transform(records):
        ...     print(record.record)
    """

    def __init__(self, sample_rate: Optional[float] = None, every_n: Optional[int] = None):
        """
        Initialize sample filter.

        Args:
            sample_rate: Fraction of records to keep (0.0 to 1.0)
            every_n: Keep every Nth record

        Note: Provide either sample_rate or every_n, not both
        """
        if sample_rate is None and every_n is None:
            raise ValueError("Must provide either sample_rate or every_n")
        if sample_rate is not None and every_n is not None:
            raise ValueError("Cannot provide both sample_rate and every_n")

        self.sample_rate = sample_rate
        self.every_n = every_n
        self._counter = 0

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by sampling.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            Sampled RecordMessage objects
        """
        import random

        for record_msg in records:
            try:
                if self.every_n:
                    # Deterministic sampling - every Nth record
                    self._counter += 1
                    if self._counter % self.every_n == 0:
                        yield record_msg
                else:
                    # Random sampling based on rate
                    if random.random() < self.sample_rate:
                        yield record_msg

            except Exception as e:
                logger.error(f"Error sampling record: {str(e)}")
                raise TransformationError(f"Sample filtering failed: {str(e)}")


class LimitFilter:
    """
    Transform that limits the number of records.

    Example:
        >>> filter = LimitFilter(limit=100)
        >>> for record in filter.transform(records):
        ...     print(record.record)  # Only first 100 records
    """

    def __init__(self, limit: int, offset: int = 0):
        """
        Initialize limit filter.

        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip before starting
        """
        self.limit = limit
        self.offset = offset
        self._counter = 0

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by limiting count.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            Limited RecordMessage objects
        """
        for record_msg in records:
            try:
                # Skip offset records
                if self._counter < self.offset:
                    self._counter += 1
                    continue

                # Check if we've reached the limit
                if self._counter >= self.offset + self.limit:
                    break

                self._counter += 1
                yield record_msg

            except Exception as e:
                logger.error(f"Error limiting records: {str(e)}")
                raise TransformationError(f"Limit filtering failed: {str(e)}")


class CompositeFilter:
    """
    Combines multiple filters in sequence.

    Example:
        >>> filter1 = RowFilter([{'column': 'status', 'operator': '=', 'value': 'active'}])
        >>> filter2 = LimitFilter(100)
        >>> composite = CompositeFilter([filter1, filter2])
    """

    def __init__(self, filters: List[Any]):
        """
        Initialize composite filter.

        Args:
            filters: List of filter objects (each must have a transform method)
        """
        self.filters = filters

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by applying filters in sequence.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            Filtered RecordMessage objects
        """
        current = records

        # Apply each filter in sequence
        for filter_obj in self.filters:
            current = filter_obj.transform(current)

        # Yield final results
        yield from current


def create_row_filter(config: Dict[str, Any]) -> RowFilter:
    """
    Factory function to create RowFilter from configuration.

    Args:
        config: Configuration dictionary with 'conditions' key

    Returns:
        RowFilter instance

    Example:
        >>> config = {
        ...     'conditions': [
        ...         {'column': 'status', 'operator': '=', 'value': 'active'}
        ...     ],
        ...     'match_all': True
        ... }
        >>> filter = create_row_filter(config)
    """
    if 'conditions' not in config:
        raise ValueError("Row filter config must include 'conditions' key")

    return RowFilter(
        conditions=config['conditions'],
        match_all=config.get('match_all', True)
    )


def create_duplicate_filter(config: Dict[str, Any]) -> DuplicateFilter:
    """
    Factory function to create DuplicateFilter from configuration.

    Args:
        config: Configuration dictionary with 'key_columns' key

    Returns:
        DuplicateFilter instance
    """
    if 'key_columns' not in config:
        raise ValueError("Duplicate filter config must include 'key_columns' key")

    return DuplicateFilter(config['key_columns'])


def create_limit_filter(config: Dict[str, Any]) -> LimitFilter:
    """
    Factory function to create LimitFilter from configuration.

    Args:
        config: Configuration dictionary with 'limit' key

    Returns:
        LimitFilter instance
    """
    if 'limit' not in config:
        raise ValueError("Limit filter config must include 'limit' key")

    return LimitFilter(
        limit=config['limit'],
        offset=config.get('offset', 0)
    )

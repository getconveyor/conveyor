"""
Column mapping transformations.

This module provides transformations for renaming and mapping columns
in data streams.
"""

from typing import Dict, Any, Iterator, Optional, List
import logging

from integration.singer.messages import RecordMessage
from integration.exceptions import TransformationError

logger = logging.getLogger(__name__)


class ColumnMapper:
    """
    Transform that renames columns based on a mapping dictionary.

    Example:
        >>> mapper = ColumnMapper({'old_name': 'new_name', 'id': 'user_id'})
        >>> for record in mapper.transform(records):
        ...     print(record.record)
        {'user_id': 1, 'new_name': 'John'}
    """

    def __init__(self, mapping: Dict[str, str]):
        """
        Initialize column mapper.

        Args:
            mapping: Dictionary mapping old column names to new names
                    Example: {'old_col': 'new_col', 'user_id': 'id'}
        """
        self.mapping = mapping
        self.reverse_mapping = {v: k for k, v in mapping.items()}

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by renaming columns.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects with renamed columns
        """
        for record_msg in records:
            try:
                # Apply column mapping
                new_record = {}

                for old_name, value in record_msg.record.items():
                    # Use mapped name if exists, otherwise keep original
                    new_name = self.mapping.get(old_name, old_name)
                    new_record[new_name] = value

                # Create new RecordMessage with transformed record
                yield RecordMessage(
                    stream=record_msg.stream,
                    record=new_record,
                    time_extracted=record_msg.time_extracted
                )

            except Exception as e:
                logger.error(f"Error mapping columns in record: {str(e)}")
                raise TransformationError(f"Column mapping failed: {str(e)}")

    def reverse_transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Reverse the column mapping (useful for writing back to source schema).

        Args:
            records: Iterator of RecordMessage objects with new column names

        Yields:
            RecordMessage objects with original column names
        """
        for record_msg in records:
            try:
                # Apply reverse mapping
                new_record = {}

                for new_name, value in record_msg.record.items():
                    # Use original name if exists, otherwise keep current
                    old_name = self.reverse_mapping.get(new_name, new_name)
                    new_record[old_name] = value

                yield RecordMessage(
                    stream=record_msg.stream,
                    record=new_record,
                    time_extracted=record_msg.time_extracted
                )

            except Exception as e:
                logger.error(f"Error reverse mapping columns in record: {str(e)}")
                raise TransformationError(f"Reverse column mapping failed: {str(e)}")


class ColumnSelector:
    """
    Transform that selects only specific columns from records.

    Example:
        >>> selector = ColumnSelector(['id', 'name', 'email'])
        >>> for record in selector.transform(records):
        ...     print(record.record)
        {'id': 1, 'name': 'John', 'email': 'john@example.com'}
    """

    def __init__(self, columns: List[str], drop_extra: bool = True):
        """
        Initialize column selector.

        Args:
            columns: List of column names to keep
            drop_extra: If True, drop columns not in list. If False, keep them.
        """
        self.columns = set(columns)
        self.drop_extra = drop_extra

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by selecting specific columns.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects with selected columns
        """
        for record_msg in records:
            try:
                if self.drop_extra:
                    # Keep only specified columns
                    new_record = {
                        col: record_msg.record[col]
                        for col in self.columns
                        if col in record_msg.record
                    }
                else:
                    # Keep specified columns plus any extras
                    new_record = record_msg.record.copy()

                yield RecordMessage(
                    stream=record_msg.stream,
                    record=new_record,
                    time_extracted=record_msg.time_extracted
                )

            except Exception as e:
                logger.error(f"Error selecting columns in record: {str(e)}")
                raise TransformationError(f"Column selection failed: {str(e)}")


class TypeConverter:
    """
    Transform that converts column data types.

    Example:
        >>> converter = TypeConverter({'age': int, 'score': float})
        >>> for record in converter.transform(records):
        ...     print(record.record)
        {'age': 25, 'score': 95.5}
    """

    def __init__(self, type_mapping: Dict[str, Any]):
        """
        Initialize type converter.

        Args:
            type_mapping: Dictionary mapping column names to type conversion functions
                         Example: {'age': int, 'price': float, 'active': bool}
        """
        self.type_mapping = type_mapping

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by converting column types.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects with converted types
        """
        for record_msg in records:
            try:
                new_record = record_msg.record.copy()

                for col_name, type_func in self.type_mapping.items():
                    if col_name in new_record and new_record[col_name] is not None:
                        try:
                            new_record[col_name] = type_func(new_record[col_name])
                        except (ValueError, TypeError) as e:
                            logger.warning(
                                f"Failed to convert {col_name} to {type_func.__name__}: {str(e)}"
                            )
                            # Keep original value on conversion failure

                yield RecordMessage(
                    stream=record_msg.stream,
                    record=new_record,
                    time_extracted=record_msg.time_extracted
                )

            except Exception as e:
                logger.error(f"Error converting types in record: {str(e)}")
                raise TransformationError(f"Type conversion failed: {str(e)}")


class ValueMapper:
    """
    Transform that maps specific values in columns to new values.

    Useful for standardizing categorical data or fixing data quality issues.

    Example:
        >>> mapper = ValueMapper({
        ...     'status': {'active': 'ACTIVE', 'inactive': 'INACTIVE'},
        ...     'country': {'US': 'USA', 'UK': 'GBR'}
        ... })
    """

    def __init__(self, mappings: Dict[str, Dict[Any, Any]]):
        """
        Initialize value mapper.

        Args:
            mappings: Dictionary mapping column names to value mappings
                     Example: {'status': {'old_val': 'new_val'}}
        """
        self.mappings = mappings

    def transform(self, records: Iterator[RecordMessage]) -> Iterator[RecordMessage]:
        """
        Transform records by mapping specific values.

        Args:
            records: Iterator of RecordMessage objects

        Yields:
            RecordMessage objects with mapped values
        """
        for record_msg in records:
            try:
                new_record = record_msg.record.copy()

                for col_name, value_map in self.mappings.items():
                    if col_name in new_record:
                        current_value = new_record[col_name]
                        # Map value if it exists in mapping, otherwise keep original
                        new_record[col_name] = value_map.get(current_value, current_value)

                yield RecordMessage(
                    stream=record_msg.stream,
                    record=new_record,
                    time_extracted=record_msg.time_extracted
                )

            except Exception as e:
                logger.error(f"Error mapping values in record: {str(e)}")
                raise TransformationError(f"Value mapping failed: {str(e)}")


def create_column_mapper(config: Dict[str, Any]) -> ColumnMapper:
    """
    Factory function to create ColumnMapper from configuration.

    Args:
        config: Configuration dictionary with 'mapping' key

    Returns:
        ColumnMapper instance

    Example:
        >>> config = {'mapping': {'old_col': 'new_col'}}
        >>> mapper = create_column_mapper(config)
    """
    if 'mapping' not in config:
        raise ValueError("Column mapper config must include 'mapping' key")

    return ColumnMapper(config['mapping'])


def create_column_selector(config: Dict[str, Any]) -> ColumnSelector:
    """
    Factory function to create ColumnSelector from configuration.

    Args:
        config: Configuration dictionary with 'columns' key

    Returns:
        ColumnSelector instance

    Example:
        >>> config = {'columns': ['id', 'name'], 'drop_extra': True}
        >>> selector = create_column_selector(config)
    """
    if 'columns' not in config:
        raise ValueError("Column selector config must include 'columns' key")

    return ColumnSelector(
        columns=config['columns'],
        drop_extra=config.get('drop_extra', True)
    )


def create_type_converter(config: Dict[str, Any]) -> TypeConverter:
    """
    Factory function to create TypeConverter from configuration.

    Args:
        config: Configuration dictionary with 'type_mapping' key

    Returns:
        TypeConverter instance

    Example:
        >>> config = {'type_mapping': {'age': 'int', 'price': 'float'}}
        >>> converter = create_type_converter(config)
    """
    if 'type_mapping' not in config:
        raise ValueError("Type converter config must include 'type_mapping' key")

    # Convert string type names to actual type functions
    type_functions = {
        'int': int,
        'float': float,
        'str': str,
        'bool': bool
    }

    type_mapping = {}
    for col, type_name in config['type_mapping'].items():
        if isinstance(type_name, str):
            type_mapping[col] = type_functions.get(type_name, str)
        else:
            type_mapping[col] = type_name

    return TypeConverter(type_mapping)

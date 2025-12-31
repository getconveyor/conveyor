"""
Schema utilities and type mapping for Singer protocol.

This module provides type mapping between database-specific types and
Singer/JSON Schema types, enabling seamless data transfer between different
systems.
"""

from typing import Dict, Any, Optional
from enum import Enum


class DataType(Enum):
    """
    Standard data types used across different database systems.

    These are the canonical types that Singer uses to represent data.
    """
    STRING = "string"
    INTEGER = "integer"
    NUMBER = "number"       # Floating point numbers
    BOOLEAN = "boolean"
    DATETIME = "datetime"
    DATE = "date"
    TIME = "time"
    BINARY = "binary"
    JSON = "json"
    ARRAY = "array"
    OBJECT = "object"
    NULL = "null"


class TypeMapper:
    """
    Maps database-specific types to Singer types and JSON Schema format.

    Supports multiple database systems with extensible type mapping.
    """

    # PostgreSQL type mappings
    POSTGRESQL_TO_SINGER = {
        # Integer types
        'smallint': DataType.INTEGER,
        'integer': DataType.INTEGER,
        'bigint': DataType.INTEGER,
        'smallserial': DataType.INTEGER,
        'serial': DataType.INTEGER,
        'bigserial': DataType.INTEGER,

        # Floating point types
        'decimal': DataType.NUMBER,
        'numeric': DataType.NUMBER,
        'real': DataType.NUMBER,
        'double precision': DataType.NUMBER,
        'money': DataType.NUMBER,

        # String types
        'character varying': DataType.STRING,
        'varchar': DataType.STRING,
        'character': DataType.STRING,
        'char': DataType.STRING,
        'text': DataType.STRING,
        'citext': DataType.STRING,

        # Boolean type
        'boolean': DataType.BOOLEAN,
        'bool': DataType.BOOLEAN,

        # Date/Time types
        'timestamp': DataType.DATETIME,
        'timestamp without time zone': DataType.DATETIME,
        'timestamp with time zone': DataType.DATETIME,
        'timestamptz': DataType.DATETIME,
        'date': DataType.DATE,
        'time': DataType.TIME,
        'time without time zone': DataType.TIME,
        'time with time zone': DataType.TIME,
        'timetz': DataType.TIME,
        'interval': DataType.STRING,  # Store as string

        # Binary types
        'bytea': DataType.BINARY,
        'bit': DataType.BINARY,
        'bit varying': DataType.BINARY,

        # JSON types
        'json': DataType.JSON,
        'jsonb': DataType.JSON,

        # Array types
        'array': DataType.ARRAY,
        'ARRAY': DataType.ARRAY,

        # Other types (map to string by default)
        'uuid': DataType.STRING,
        'xml': DataType.STRING,
        'cidr': DataType.STRING,
        'inet': DataType.STRING,
        'macaddr': DataType.STRING,
        'point': DataType.STRING,
        'line': DataType.STRING,
        'lseg': DataType.STRING,
        'box': DataType.STRING,
        'path': DataType.STRING,
        'polygon': DataType.STRING,
        'circle': DataType.STRING,
    }

    # MySQL type mappings
    MYSQL_TO_SINGER = {
        # Integer types
        'tinyint': DataType.INTEGER,
        'smallint': DataType.INTEGER,
        'mediumint': DataType.INTEGER,
        'int': DataType.INTEGER,
        'integer': DataType.INTEGER,
        'bigint': DataType.INTEGER,

        # Floating point types
        'float': DataType.NUMBER,
        'double': DataType.NUMBER,
        'double precision': DataType.NUMBER,
        'decimal': DataType.NUMBER,
        'dec': DataType.NUMBER,
        'numeric': DataType.NUMBER,
        'fixed': DataType.NUMBER,

        # String types
        'char': DataType.STRING,
        'varchar': DataType.STRING,
        'text': DataType.STRING,
        'tinytext': DataType.STRING,
        'mediumtext': DataType.STRING,
        'longtext': DataType.STRING,
        'enum': DataType.STRING,
        'set': DataType.STRING,

        # Boolean type (TINYINT(1) in MySQL)
        'boolean': DataType.BOOLEAN,
        'bool': DataType.BOOLEAN,

        # Date/Time types
        'date': DataType.DATE,
        'datetime': DataType.DATETIME,
        'timestamp': DataType.DATETIME,
        'time': DataType.TIME,
        'year': DataType.INTEGER,

        # Binary types
        'binary': DataType.BINARY,
        'varbinary': DataType.BINARY,
        'blob': DataType.BINARY,
        'tinyblob': DataType.BINARY,
        'mediumblob': DataType.BINARY,
        'longblob': DataType.BINARY,

        # JSON type
        'json': DataType.JSON,

        # Spatial types (map to string)
        'geometry': DataType.STRING,
        'point': DataType.STRING,
        'linestring': DataType.STRING,
        'polygon': DataType.STRING,
        'multipoint': DataType.STRING,
        'multilinestring': DataType.STRING,
        'multipolygon': DataType.STRING,
        'geometrycollection': DataType.STRING,
    }

    @classmethod
    def to_singer_type(cls, db_type: str, connector_type: str) -> DataType:
        """
        Convert database-specific type to Singer DataType.

        Args:
            db_type: Database type string (e.g., "varchar", "integer")
            connector_type: Type of database connector (e.g., "postgresql", "mysql")

        Returns:
            Corresponding Singer DataType

        Example:
            >>> TypeMapper.to_singer_type("varchar", "postgresql")
            DataType.STRING
        """
        db_type_lower = db_type.lower().strip()

        # Remove size/precision info: varchar(255) -> varchar
        if '(' in db_type_lower:
            db_type_lower = db_type_lower.split('(')[0].strip()

        # Remove array brackets: integer[] -> integer, ARRAY
        if db_type_lower.endswith('[]'):
            return DataType.ARRAY

        if connector_type == 'postgresql':
            return cls.POSTGRESQL_TO_SINGER.get(db_type_lower, DataType.STRING)
        elif connector_type == 'mysql':
            return cls.MYSQL_TO_SINGER.get(db_type_lower, DataType.STRING)
        else:
            # Default fallback
            return DataType.STRING

    @classmethod
    def to_json_schema_type(cls, data_type: DataType, nullable: bool = False) -> Dict[str, Any]:
        """
        Convert Singer DataType to JSON Schema format.

        Args:
            data_type: Singer DataType
            nullable: Whether the field can be null

        Returns:
            JSON Schema type definition

        Example:
            >>> TypeMapper.to_json_schema_type(DataType.STRING, nullable=True)
            {'type': ['string', 'null']}
        """
        type_map = {
            DataType.STRING: {"type": "string"},
            DataType.INTEGER: {"type": "integer"},
            DataType.NUMBER: {"type": "number"},
            DataType.BOOLEAN: {"type": "boolean"},
            DataType.DATETIME: {"type": "string", "format": "date-time"},
            DataType.DATE: {"type": "string", "format": "date"},
            DataType.TIME: {"type": "string", "format": "time"},
            DataType.BINARY: {"type": "string", "contentEncoding": "base64"},
            DataType.JSON: {"type": "object"},
            DataType.ARRAY: {"type": "array"},
            DataType.OBJECT: {"type": "object"},
            DataType.NULL: {"type": "null"},
        }

        schema = type_map.get(data_type, {"type": "string"})

        # Handle nullable fields
        if nullable:
            if isinstance(schema.get("type"), str):
                schema["type"] = [schema["type"], "null"]

        return schema

    @classmethod
    def infer_type_from_value(cls, value: Any) -> DataType:
        """
        Infer Singer DataType from a Python value.

        Useful for schema inference from actual data.

        Args:
            value: Python value

        Returns:
            Inferred DataType

        Example:
            >>> TypeMapper.infer_type_from_value(42)
            DataType.INTEGER
        """
        if value is None:
            return DataType.NULL
        elif isinstance(value, bool):
            return DataType.BOOLEAN
        elif isinstance(value, int):
            return DataType.INTEGER
        elif isinstance(value, float):
            return DataType.NUMBER
        elif isinstance(value, str):
            return DataType.STRING
        elif isinstance(value, (list, tuple)):
            return DataType.ARRAY
        elif isinstance(value, dict):
            return DataType.JSON
        elif isinstance(value, bytes):
            return DataType.BINARY
        else:
            return DataType.STRING

    @classmethod
    def build_json_schema(
        cls,
        columns: list,
        connector_type: str,
        required_columns: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Build a complete JSON Schema from column definitions.

        Args:
            columns: List of column dicts with 'name', 'type', 'nullable' keys
            connector_type: Type of database connector
            required_columns: List of required column names

        Returns:
            Complete JSON Schema object

        Example:
            >>> columns = [
            ...     {'name': 'id', 'type': 'integer', 'nullable': False},
            ...     {'name': 'email', 'type': 'varchar', 'nullable': False}
            ... ]
            >>> schema = TypeMapper.build_json_schema(columns, 'postgresql', ['id'])
            >>> schema['type']
            'object'
        """
        properties = {}

        for col in columns:
            col_name = col['name']
            db_type = col['type']
            nullable = col.get('nullable', True)

            # Convert to Singer type
            singer_type = cls.to_singer_type(db_type, connector_type)

            # Convert to JSON Schema
            properties[col_name] = cls.to_json_schema_type(singer_type, nullable)

        schema = {
            "type": "object",
            "properties": properties
        }

        if required_columns:
            schema["required"] = required_columns

        return schema


class CatalogBuilder:
    """
    Builds Singer catalog from discovered schema.

    A catalog describes all available streams and their schemas.
    """

    @staticmethod
    def build_stream_catalog(
        stream_name: str,
        schema: Dict[str, Any],
        key_properties: list,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build catalog entry for a single stream.

        Args:
            stream_name: Name of the stream
            schema: JSON Schema for the stream
            key_properties: Primary key columns
            metadata: Additional stream metadata

        Returns:
            Catalog entry dictionary
        """
        return {
            "stream": stream_name,
            "tap_stream_id": stream_name,
            "schema": schema,
            "key_properties": key_properties,
            "metadata": metadata or {},
            "replication_method": "FULL_TABLE",  # Default, can be overridden
            "replication_key": None,
        }

    @staticmethod
    def build_catalog(streams: list) -> Dict[str, Any]:
        """
        Build complete catalog from multiple streams.

        Args:
            streams: List of stream catalog entries

        Returns:
            Complete catalog dictionary
        """
        return {
            "streams": streams
        }

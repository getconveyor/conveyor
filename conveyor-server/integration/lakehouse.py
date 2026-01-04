"""
Lakehouse writer module for Apache Iceberg integration.

This module provides functionality to write data to the lakehouse using Apache Iceberg
table format, storing data in MinIO (S3-compatible storage).
"""

import logging
from typing import Dict, Any, Iterator, List, Optional
from datetime import datetime
import pyarrow as pa
import pyarrow.parquet as pq
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import (
    NestedField,
    StringType,
    IntegerType,
    LongType,
    DoubleType,
    BooleanType,
    TimestampType,
    DateType,
)
from pyiceberg.partitioning import PartitionSpec, PartitionField
from pyiceberg.transforms import DayTransform
import pandas as pd

from integration.singer.messages import RecordMessage
from integration.exceptions import DataWriteError

logger = logging.getLogger(__name__)


class LakehouseWriter:
    """
    Writer for Apache Iceberg tables in the lakehouse.

    Handles writing data from ETL pipelines to Iceberg tables with automatic
    schema inference, partitioning, and optimization.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize lakehouse writer.

        Args:
            config: Lakehouse configuration including:
                - layer: bronze, silver, or gold
                - namespace: logical grouping (e.g., "sales", "marketing")
                - table_name: name of the table
                - metastore_uri: Hive metastore URI (default: thrift://hive-metastore:9083)
                - warehouse: S3 warehouse location (default: s3://conveyor-lakehouse/)
                - s3_endpoint: MinIO endpoint (default: http://minio:9000)
                - aws_access_key_id: S3 access key
                - aws_secret_access_key: S3 secret key
        """
        self.config = config
        self.layer = config.get('layer', 'bronze')
        self.namespace = config.get('namespace', 'default')
        self.table_name = config.get('table_name')

        if not self.table_name:
            raise ValueError("table_name is required in lakehouse config")

        # Construct full table identifier
        self.full_table_name = f"{self.layer}.{self.namespace}.{self.table_name}"

        # Catalog configuration
        self.catalog_config = {
            'uri': config.get('metastore_uri', 'thrift://hive-metastore:9083'),
            'warehouse': config.get('warehouse', 's3://conveyor-lakehouse/'),
            's3.endpoint': config.get('s3_endpoint', 'http://minio:9000'),
            's3.access-key-id': config.get('aws_access_key_id', 'minioadmin'),
            's3.secret-access-key': config.get('aws_secret_access_key', 'minioadmin'),
            's3.path-style-access': 'true',
        }

        self.catalog = None
        self.table = None

    def _get_catalog(self):
        """Get or create Hive catalog connection."""
        if self.catalog is None:
            self.catalog = load_catalog(
                name='hive',
                **self.catalog_config
            )
        return self.catalog

    def _infer_iceberg_type(self, value: Any) -> Any:
        """
        Infer Iceberg type from Python value.

        Args:
            value: Python value to infer type from

        Returns:
            Iceberg type
        """
        if value is None:
            return StringType()  # Default to string for null values
        elif isinstance(value, bool):
            return BooleanType()
        elif isinstance(value, int):
            # Use Long for integers to handle large values
            return LongType()
        elif isinstance(value, float):
            return DoubleType()
        elif isinstance(value, str):
            return StringType()
        elif isinstance(value, datetime):
            return TimestampType()
        else:
            # Default to string for unknown types
            return StringType()

    def _records_to_arrow(
        self,
        records: Iterator[RecordMessage]
    ) -> pa.Table:
        """
        Convert RecordMessage iterator to PyArrow Table.

        Args:
            records: Iterator of RecordMessage objects

        Returns:
            PyArrow Table
        """
        # Collect records into list
        record_dicts = []
        for msg in records:
            record_dicts.append(msg.record)

        if not record_dicts:
            raise DataWriteError("No records to write to lakehouse")

        # Convert to pandas DataFrame for easier handling
        df = pd.DataFrame(record_dicts)

        # Convert DataFrame to PyArrow Table
        arrow_table = pa.Table.from_pandas(df)

        logger.info(f"Converted {len(record_dicts)} records to Arrow table")

        return arrow_table

    def _create_table_if_not_exists(
        self,
        arrow_table: pa.Table
    ):
        """
        Create Iceberg table if it doesn't exist.

        Args:
            arrow_table: PyArrow table with data
        """
        catalog = self._get_catalog()

        # Create namespace if it doesn't exist
        namespace_name = f"{self.layer}.{self.namespace}"
        try:
            catalog.create_namespace(namespace_name)
            logger.info(f"Created namespace: {namespace_name}")
        except Exception as e:
            # Namespace might already exist
            logger.debug(f"Namespace {namespace_name} might already exist: {e}")

        # Check if table exists
        try:
            self.table = catalog.load_table(self.full_table_name)
            logger.info(f"Table {self.full_table_name} already exists")
        except Exception:
            # Table doesn't exist, create it
            logger.info(f"Creating new table: {self.full_table_name}")

            # Convert PyArrow schema to Iceberg schema
            iceberg_fields = []
            for i, field in enumerate(arrow_table.schema):
                # Map PyArrow types to Iceberg types
                if pa.types.is_string(field.type) or pa.types.is_large_string(field.type):
                    iceberg_type = StringType()
                elif pa.types.is_integer(field.type):
                    iceberg_type = LongType()
                elif pa.types.is_floating(field.type):
                    iceberg_type = DoubleType()
                elif pa.types.is_boolean(field.type):
                    iceberg_type = BooleanType()
                elif pa.types.is_timestamp(field.type):
                    iceberg_type = TimestampType()
                elif pa.types.is_date(field.type):
                    iceberg_type = DateType()
                else:
                    # Default to string for unknown types
                    iceberg_type = StringType()

                iceberg_fields.append(
                    NestedField(
                        field_id=i + 1,
                        name=field.name,
                        field_type=iceberg_type,
                        required=False
                    )
                )

            schema = Schema(*iceberg_fields)

            # Create partition spec (optional - partition by day if timestamp exists)
            partition_spec = PartitionSpec()

            # Create table
            self.table = catalog.create_table(
                identifier=self.full_table_name,
                schema=schema,
                partition_spec=partition_spec
            )

            logger.info(f"Created table {self.full_table_name} with schema: {schema}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write records to Iceberg table.

        Args:
            stream: Stream name (used for logging)
            schema: JSON schema (not used, we infer from data)
            records: Iterator of RecordMessage objects
            key_properties: List of key column names (optional)

        Returns:
            Dictionary with write statistics
        """
        try:
            logger.info(f"Writing stream '{stream}' to lakehouse table: {self.full_table_name}")

            # Convert records to Arrow table
            arrow_table = self._records_to_arrow(records)
            record_count = len(arrow_table)

            # Create table if it doesn't exist
            self._create_table_if_not_exists(arrow_table)

            # Append data to table
            logger.info(f"Appending {record_count} records to {self.full_table_name}")
            self.table.append(arrow_table)

            logger.info(f"Successfully wrote {record_count} records to {self.full_table_name}")

            return {
                'success': True,
                'total_records': record_count,
                'table': self.full_table_name,
                'layer': self.layer,
                'namespace': self.namespace
            }

        except Exception as e:
            logger.error(f"Failed to write to lakehouse: {str(e)}")
            raise DataWriteError(f"Lakehouse write failed: {str(e)}")

    def close(self):
        """Close catalog connection."""
        # PyIceberg doesn't require explicit cleanup
        self.catalog = None
        self.table = None
        logger.debug(f"Closed lakehouse writer for {self.full_table_name}")

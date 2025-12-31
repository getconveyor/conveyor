"""
File connector implementation for CSV and JSON files.

This connector provides source and destination support for file-based data,
including local filesystem and future cloud storage (S3, GCS, etc.).
"""

import pandas as pd
import json
import os
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
from pathlib import Path
import logging

from integration.connectors.base import (
    BaseConnector,
    ConnectionTestResult,
    DiscoveryResult
)
from integration.connectors.factory import register_connector, ConnectorMetadata
from integration.singer.messages import RecordMessage, SchemaMessage
from integration.singer.schema import TypeMapper
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('file')
class FileConnector(BaseConnector):
    """
    File connector for CSV and JSON files.

    Supports:
    - CSV files with configurable delimiters and encoding
    - JSON files (both array and line-delimited)
    - Local filesystem access
    - Schema inference from data
    - Batch reading and writing
    """

    SUPPORTED_FORMATS = ['csv', 'json', 'jsonl']

    def __init__(self, connection: 'Connection'):
        """
        Initialize File connector.

        Config options:
        - file_path: Path to file or directory
        - file_format: File format (csv, json, jsonl)
        - encoding: File encoding (default: 'utf-8')
        - delimiter: CSV delimiter (default: ',')
        - has_header: Whether CSV has header row (default: True)
        - compression: Compression type (gzip, bz2, zip, xz, None)
        - json_array: For JSON, whether it's an array (default: True) vs line-delimited
        - sample_size: Number of rows to sample for schema inference (default: 100)
        """
        super().__init__(connection)

        self.file_path = self.config.get('file_path')
        self.file_format = self.config.get('file_format', 'csv').lower()
        self.encoding = self.config.get('encoding', 'utf-8')
        self.delimiter = self.config.get('delimiter', ',')
        self.has_header = self.config.get('has_header', True)
        self.compression = self.config.get('compression')
        self.json_array = self.config.get('json_array', True)
        self.sample_size = self.config.get('sample_size', 100)

        # Validate format
        if self.file_format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported file format: {self.file_format}. "
                f"Supported formats: {', '.join(self.SUPPORTED_FORMATS)}"
            )

    def test(self) -> ConnectionTestResult:
        """
        Test file access.

        Returns:
            ConnectionTestResult with success status and file info
        """
        try:
            if not self.file_path:
                return ConnectionTestResult(
                    success=False,
                    message="No file path configured",
                    details={'error_type': 'ConfigurationError'}
                )

            path = Path(self.file_path)

            # Check if path exists
            if not path.exists():
                return ConnectionTestResult(
                    success=False,
                    message=f"File or directory does not exist: {self.file_path}",
                    details={'error_type': 'FileNotFoundError'}
                )

            # Get file/directory info
            if path.is_file():
                file_size = path.stat().st_size
                file_info = {
                    'type': 'file',
                    'size_bytes': file_size,
                    'size_mb': round(file_size / (1024 * 1024), 2),
                    'format': self.file_format
                }
            else:
                # Directory
                files = list(path.glob(f'*.{self.file_format}'))
                file_info = {
                    'type': 'directory',
                    'file_count': len(files),
                    'format': self.file_format
                }

            return ConnectionTestResult(
                success=True,
                message=f"Successfully accessed file path: {self.file_path}",
                details=file_info
            )

        except PermissionError:
            return ConnectionTestResult(
                success=False,
                message=f"Permission denied accessing: {self.file_path}",
                details={'error_type': 'PermissionError'}
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message=f"File access test failed: {str(e)}",
                details={'error_type': type(e).__name__}
            )

    def discover(self) -> DiscoveryResult:
        """
        Discover files and infer schemas.

        Returns:
            DiscoveryResult with streams and schemas
        """
        try:
            path = Path(self.file_path)
            streams = []
            schemas = {}

            if path.is_file():
                # Single file
                stream_name = path.stem  # Filename without extension
                schema = self._infer_schema(path)

                streams.append({
                    'name': stream_name,
                    'file_path': str(path),
                    'file_format': self.file_format
                })
                schemas[stream_name] = schema

            else:
                # Directory - find all matching files
                pattern = f'*.{self.file_format}'
                files = sorted(path.glob(pattern))

                for file_path in files:
                    stream_name = file_path.stem
                    schema = self._infer_schema(file_path)

                    streams.append({
                        'name': stream_name,
                        'file_path': str(file_path),
                        'file_format': self.file_format
                    })
                    schemas[stream_name] = schema

            return DiscoveryResult(
                streams=streams,
                schemas=schemas
            )

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover file schemas: {str(e)}")

    def _infer_schema(self, file_path: Path) -> Dict[str, Any]:
        """
        Infer JSON schema from file contents.

        Args:
            file_path: Path to file

        Returns:
            JSON schema dictionary
        """
        try:
            if self.file_format == 'csv':
                # Read sample of CSV
                df = pd.read_csv(
                    file_path,
                    nrows=self.sample_size,
                    encoding=self.encoding,
                    delimiter=self.delimiter,
                    compression=self.compression
                )

                # Infer schema from pandas types
                properties = {}
                for col_name, dtype in df.dtypes.items():
                    if pd.api.types.is_integer_dtype(dtype):
                        col_type = 'integer'
                    elif pd.api.types.is_float_dtype(dtype):
                        col_type = 'number'
                    elif pd.api.types.is_bool_dtype(dtype):
                        col_type = 'boolean'
                    elif pd.api.types.is_datetime64_any_dtype(dtype):
                        col_type = 'string'
                        properties[col_name] = {'type': [col_type, 'null'], 'format': 'date-time'}
                        continue
                    else:
                        col_type = 'string'

                    properties[col_name] = {'type': [col_type, 'null']}

            elif self.file_format in ['json', 'jsonl']:
                # Read sample of JSON
                if self.file_format == 'json' and self.json_array:
                    with open(file_path, 'r', encoding=self.encoding) as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            sample = data[:self.sample_size]
                        else:
                            sample = [data]
                else:
                    # Line-delimited JSON
                    sample = []
                    with open(file_path, 'r', encoding=self.encoding) as f:
                        for i, line in enumerate(f):
                            if i >= self.sample_size:
                                break
                            sample.append(json.loads(line))

                # Infer schema from sample
                properties = {}
                if sample:
                    # Get all unique keys
                    all_keys = set()
                    for record in sample:
                        if isinstance(record, dict):
                            all_keys.update(record.keys())

                    # Infer type for each key
                    for key in all_keys:
                        # Get sample values
                        values = [r.get(key) for r in sample if isinstance(r, dict) and key in r]

                        if not values:
                            properties[key] = {'type': ['string', 'null']}
                            continue

                        # Determine most common type
                        types = set()
                        for value in values:
                            singer_type = TypeMapper.infer_type_from_value(value)
                            types.add(singer_type.value)

                        # Use most specific type
                        if 'integer' in types:
                            col_type = 'integer'
                        elif 'number' in types:
                            col_type = 'number'
                        elif 'boolean' in types:
                            col_type = 'boolean'
                        else:
                            col_type = 'string'

                        properties[key] = {'type': [col_type, 'null']}

            else:
                properties = {}

            return {
                'type': 'object',
                'properties': properties
            }

        except Exception as e:
            logger.warning(f"Failed to infer schema for {file_path}: {str(e)}")
            return {'type': 'object', 'properties': {}}

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from a file.

        Args:
            stream: Stream name (filename without extension)
            schema: JSON schema for the data
            state: Previous state (not used for files)

        Yields:
            RecordMessage objects for each record
        """
        try:
            # Find file path
            path = Path(self.file_path)
            if path.is_file():
                file_path = path
            else:
                # Look for file in directory
                file_path = path / f"{stream}.{self.file_format}"

            if not file_path.exists():
                raise DataReadError(f"File not found: {file_path}")

            logger.info(f"Reading from file: {file_path}")

            total_count = 0

            if self.file_format == 'csv':
                # Read CSV in chunks
                chunk_iterator = pd.read_csv(
                    file_path,
                    encoding=self.encoding,
                    delimiter=self.delimiter,
                    compression=self.compression,
                    chunksize=self.batch_size
                )

                for chunk in chunk_iterator:
                    for _, row in chunk.iterrows():
                        record = row.to_dict()

                        # Convert NaN to None
                        record = {k: (None if pd.isna(v) else v) for k, v in record.items()}

                        yield RecordMessage(
                            stream=stream,
                            record=record,
                            time_extracted=datetime.utcnow()
                        )
                        total_count += 1

            elif self.file_format in ['json', 'jsonl']:
                if self.file_format == 'json' and self.json_array:
                    # JSON array
                    with open(file_path, 'r', encoding=self.encoding) as f:
                        data = json.load(f)

                    if isinstance(data, list):
                        for record in data:
                            yield RecordMessage(
                                stream=stream,
                                record=record,
                                time_extracted=datetime.utcnow()
                            )
                            total_count += 1
                    else:
                        yield RecordMessage(
                            stream=stream,
                            record=data,
                            time_extracted=datetime.utcnow()
                        )
                        total_count += 1

                else:
                    # Line-delimited JSON
                    with open(file_path, 'r', encoding=self.encoding) as f:
                        for line in f:
                            if line.strip():
                                record = json.loads(line)
                                yield RecordMessage(
                                    stream=stream,
                                    record=record,
                                    time_extracted=datetime.utcnow()
                                )
                                total_count += 1

            logger.info(f"Finished reading {total_count} records from {file_path}")

        except Exception as e:
            raise DataReadError(f"Failed to read from file {stream}: {str(e)}")

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to a file.

        Args:
            stream: Stream name (filename without extension)
            schema: JSON schema for the data
            records: Iterator of RecordMessage objects
            key_properties: Not used for files

        Returns:
            Dictionary with write statistics
        """
        try:
            # Determine output file path
            path = Path(self.file_path)
            if path.is_dir():
                output_path = path / f"{stream}.{self.file_format}"
            else:
                output_path = path

            # Ensure directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)

            logger.info(f"Writing to file: {output_path}")

            records_written = 0
            buffer = []

            if self.file_format == 'csv':
                # Write CSV
                first_batch = True

                for record_msg in records:
                    buffer.append(record_msg.record)

                    if len(buffer) >= self.batch_size:
                        df = pd.DataFrame(buffer)
                        df.to_csv(
                            output_path,
                            mode='a' if not first_batch else 'w',
                            header=first_batch,
                            index=False,
                            encoding=self.encoding,
                            compression=self.compression
                        )
                        records_written += len(buffer)
                        buffer = []
                        first_batch = False

                # Write remaining records
                if buffer:
                    df = pd.DataFrame(buffer)
                    df.to_csv(
                        output_path,
                        mode='a' if not first_batch else 'w',
                        header=first_batch,
                        index=False,
                        encoding=self.encoding,
                        compression=self.compression
                    )
                    records_written += len(buffer)

            elif self.file_format == 'json':
                # Collect all records
                all_records = [record_msg.record for record_msg in records]
                records_written = len(all_records)

                if self.json_array:
                    # Write as JSON array
                    with open(output_path, 'w', encoding=self.encoding) as f:
                        json.dump(all_records, f, indent=2, default=str)
                else:
                    # Write as line-delimited JSON
                    with open(output_path, 'w', encoding=self.encoding) as f:
                        for record in all_records:
                            f.write(json.dumps(record, default=str) + '\n')

            elif self.file_format == 'jsonl':
                # Line-delimited JSON
                with open(output_path, 'w', encoding=self.encoding) as f:
                    for record_msg in records:
                        f.write(json.dumps(record_msg.record, default=str) + '\n')
                        records_written += 1

            logger.info(f"Wrote {records_written} records to {output_path}")

            return {
                'records_written': records_written,
                'total_records': records_written,
                'file_path': str(output_path)
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to file {stream}: {str(e)}")

    def close(self):
        """Close any open resources (files are closed after each operation)."""
        pass


# Register connector metadata
ConnectorMetadata.register_metadata(
    'file',
    name='File (CSV/JSON)',
    description='File connector for CSV and JSON files with schema inference',
    source=True,
    destination=True,
    incremental_support=False,
    required_config=['file_path', 'file_format'],
    optional_config=[
        'encoding', 'delimiter', 'has_header', 'compression',
        'json_array', 'sample_size', 'batch_size'
    ]
)

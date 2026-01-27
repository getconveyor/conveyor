"""
Amazon S3 connector implementation.

This connector provides support for reading and writing data to/from Amazon S3 buckets.
Supports various file formats including CSV, JSON, Parquet.
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
import logging
import json
import csv
from io import StringIO, BytesIO

from integration.connectors.base import (
    BaseConnector,
    ConnectionTestResult,
    DiscoveryResult
)
from integration.connectors.factory import register_connector, ConnectorMetadata
from integration.singer.messages import RecordMessage, SchemaMessage
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('s3')
class S3Connector(BaseConnector):
    """
    Amazon S3 cloud storage connector.

    Supports:
    - Reading files from S3 buckets
    - Writing files to S3 buckets
    - Multiple file formats (CSV, JSON, Parquet)
    - File pattern matching
    - IAM role and access key authentication
    """

    def __init__(self, source: 'Source'):
        """
        Initialize S3 connector.

        Config options from Source model:
        - database: Bucket name (stored in database field)
        - username: AWS Access Key ID
        - password: AWS Secret Access Key (encrypted)
        - config: Additional config (region, prefix, file_format, etc.)
        """
        super().__init__(source)

        self.bucket_name = source.database
        self.access_key = source.username
        self.secret_key = source.get_password() if source.username else None

        self.region = self.config.get('region', 'us-east-1')
        self.prefix = self.config.get('prefix', '')
        self.file_format = self.config.get('file_format', 'json')  # json, csv, parquet
        self.file_pattern = self.config.get('file_pattern', '*')

        self._client = None
        self._s3_resource = None

    def _get_client(self):
        """Get or create S3 client."""
        if self._client is None:
            try:
                if self.access_key and self.secret_key:
                    # Use access key credentials
                    self._client = boto3.client(
                        's3',
                        aws_access_key_id=self.access_key,
                        aws_secret_access_key=self.secret_key,
                        region_name=self.region
                    )

                    self._s3_resource = boto3.resource(
                        's3',
                        aws_access_key_id=self.access_key,
                        aws_secret_access_key=self.secret_key,
                        region_name=self.region
                    )
                else:
                    # Use IAM role or default credentials
                    self._client = boto3.client('s3', region_name=self.region)
                    self._s3_resource = boto3.resource('s3', region_name=self.region)

                logger.info(f"Connected to S3 bucket: {self.bucket_name}")

            except NoCredentialsError as e:
                raise ConnectionError(f"No AWS credentials found: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Failed to connect to S3: {str(e)}")

        return self._client

    def test(self) -> ConnectionTestResult:
        """
        Test S3 connection and bucket access.

        Returns:
            ConnectionTestResult with success status and bucket info
        """
        try:
            client = self._get_client()

            # Try to access the bucket
            response = client.head_bucket(Bucket=self.bucket_name)

            # List objects to verify access
            response = client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=self.prefix,
                MaxKeys=10
            )

            object_count = response.get('KeyCount', 0)

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to S3 bucket: {self.bucket_name}",
                details={
                    'bucket': self.bucket_name,
                    'region': self.region,
                    'prefix': self.prefix,
                    'sample_objects': object_count
                }
            )

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return ConnectionTestResult(
                    success=False,
                    message=f"Bucket not found: {self.bucket_name}",
                    details={'error_type': 'BucketNotFound'}
                )
            elif error_code == '403':
                return ConnectionTestResult(
                    success=False,
                    message=f"Access denied to bucket: {self.bucket_name}",
                    details={'error_type': 'AccessDenied'}
                )
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"S3 error: {str(e)}",
                    details={'error_type': error_code}
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

    def discover(self) -> DiscoveryResult:
        """
        Discover files in S3 bucket.

        Returns:
            DiscoveryResult with streams (files/prefixes) and schemas
        """
        try:
            client = self._get_client()

            # List objects in bucket
            paginator = client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.bucket_name, Prefix=self.prefix)

            streams = []
            schemas = {}

            # Group files by prefix/directory
            file_groups = {}

            for page in pages:
                if 'Contents' not in page:
                    continue

                for obj in page['Contents']:
                    key = obj['Key']

                    # Skip if doesn't match pattern
                    if self.file_pattern != '*':
                        if not self._matches_pattern(key, self.file_pattern):
                            continue

                    # Extract stream name from key
                    stream_name = self._extract_stream_name(key)

                    if stream_name not in file_groups:
                        file_groups[stream_name] = []

                    file_groups[stream_name].append({
                        'key': key,
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat()
                    })

            # Create streams for each file group
            for stream_name, files in file_groups.items():
                stream = {
                    'name': stream_name,
                    'namespace': self.bucket_name,
                    'metadata': {
                        'file_count': len(files),
                        'total_size': sum(f['size'] for f in files),
                        'file_format': self.file_format
                    }
                }

                # Infer schema from first file
                if files:
                    schema = self._infer_schema_from_file(files[0]['key'])
                    schemas[stream_name] = schema

                streams.append(stream)

            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover S3 files: {str(e)}")

    def _matches_pattern(self, key: str, pattern: str) -> bool:
        """Check if file key matches pattern."""
        import fnmatch
        return fnmatch.fnmatch(key, pattern)

    def _extract_stream_name(self, key: str) -> str:
        """Extract stream name from S3 key."""
        # Remove prefix
        if self.prefix and key.startswith(self.prefix):
            key = key[len(self.prefix):].lstrip('/')

        # Remove file extension
        name = key.rsplit('.', 1)[0]

        # Replace path separators with underscores
        return name.replace('/', '_')

    def _infer_schema_from_file(self, key: str) -> Dict[str, Any]:
        """Infer schema from first file."""
        try:
            client = self._get_client()
            response = client.get_object(Bucket=self.bucket_name, Key=key)
            content = response['Body'].read()

            if self.file_format == 'json':
                # Read first JSON line/object
                if content.strip().startswith(b'['):
                    data = json.loads(content)
                    sample = data[0] if data else {}
                else:
                    # JSONL format
                    first_line = content.split(b'\n', 1)[0]
                    sample = json.loads(first_line) if first_line else {}

                return self._schema_from_dict(sample)

            elif self.file_format == 'csv':
                # Read CSV header
                text = content.decode('utf-8')
                reader = csv.DictReader(StringIO(text))
                sample = next(reader, {})

                # All CSV fields are strings initially
                properties = {k: {'type': 'string'} for k in sample.keys()}
                return {
                    'type': 'object',
                    'properties': properties
                }

            else:
                # Generic schema for unknown formats
                return {
                    'type': 'object',
                    'properties': {},
                    'additionalProperties': True
                }

        except Exception as e:
            logger.warning(f"Failed to infer schema from {key}: {str(e)}")
            return {
                'type': 'object',
                'properties': {},
                'additionalProperties': True
            }

    def _schema_from_dict(self, data: Dict) -> Dict[str, Any]:
        """Generate JSON schema from dict."""
        properties = {}

        for key, value in data.items():
            if isinstance(value, bool):
                properties[key] = {'type': 'boolean'}
            elif isinstance(value, int) or isinstance(value, float):
                properties[key] = {'type': 'number'}
            elif isinstance(value, str):
                properties[key] = {'type': 'string'}
            elif isinstance(value, list):
                properties[key] = {'type': 'array'}
            elif isinstance(value, dict):
                properties[key] = {'type': 'object'}
            else:
                properties[key] = {'type': 'string'}

        return {
            'type': 'object',
            'properties': properties,
            'additionalProperties': True
        }

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read data from S3 files.

        Args:
            stream: Stream name
            schema: JSON schema
            state: State for incremental sync

        Yields:
            RecordMessage objects
        """
        try:
            client = self._get_client()

            # List files for this stream
            paginator = client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.bucket_name, Prefix=self.prefix)

            for page in pages:
                if 'Contents' not in page:
                    continue

                for obj in page['Contents']:
                    key = obj['Key']

                    # Check if belongs to this stream
                    if self._extract_stream_name(key) != stream:
                        continue

                    # Read file
                    response = client.get_object(Bucket=self.bucket_name, Key=key)
                    content = response['Body'].read()

                    # Parse based on format
                    if self.file_format == 'json':
                        yield from self._read_json(content, stream)
                    elif self.file_format == 'csv':
                        yield from self._read_csv(content, stream)

        except Exception as e:
            raise DataReadError(f"Failed to read from S3 stream {stream}: {str(e)}")

    def _read_json(self, content: bytes, stream: str) -> Iterator[RecordMessage]:
        """Read JSON content."""
        text = content.decode('utf-8')

        if text.strip().startswith('['):
            # JSON array
            data = json.loads(text)
            for record in data:
                yield RecordMessage(
                    stream=stream,
                    record=record,
                    time_extracted=datetime.utcnow()
                )
        else:
            # JSONL format
            for line in text.split('\n'):
                if line.strip():
                    record = json.loads(line)
                    yield RecordMessage(
                        stream=stream,
                        record=record,
                        time_extracted=datetime.utcnow()
                    )

    def _read_csv(self, content: bytes, stream: str) -> Iterator[RecordMessage]:
        """Read CSV content."""
        text = content.decode('utf-8')
        reader = csv.DictReader(StringIO(text))

        for row in reader:
            yield RecordMessage(
                stream=stream,
                record=dict(row),
                time_extracted=datetime.utcnow()
            )

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write data to S3 as files.

        Args:
            stream: Stream name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Not used for S3

        Returns:
            Write statistics
        """
        try:
            client = self._get_client()

            # Collect records
            all_records = [record_msg.record for record_msg in records]

            if not all_records:
                return {'records_written': 0, 'stream': stream}

            # Generate file key
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_key = f"{self.prefix}{stream}_{timestamp}.{self.file_format}"

            # Write based on format
            if self.file_format == 'json':
                content = '\n'.join([json.dumps(record) for record in all_records])
                content_bytes = content.encode('utf-8')
            elif self.file_format == 'csv':
                if all_records:
                    output = StringIO()
                    writer = csv.DictWriter(output, fieldnames=all_records[0].keys())
                    writer.writeheader()
                    writer.writerows(all_records)
                    content_bytes = output.getvalue().encode('utf-8')
                else:
                    content_bytes = b''
            else:
                raise DataWriteError(f"Unsupported file format: {self.file_format}")

            # Upload to S3
            client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=content_bytes
            )

            return {
                'records_written': len(all_records),
                'stream': stream,
                'file_key': file_key
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to S3 stream {stream}: {str(e)}")

    def close(self):
        """Close S3 client."""
        self._client = None
        self._s3_resource = None


# Register metadata
ConnectorMetadata.register_metadata(
    's3',
    name='Amazon S3',
    description='AWS cloud storage connector for files',
    source=True,
    destination=True,
    incremental_support=False,
    required_config=['bucket_name'],
    optional_config=['access_key', 'secret_key', 'region', 'prefix', 'file_format', 'file_pattern']
)

"""
S3/MinIO Storage utilities for Data Lake file operations
"""
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from django.conf import settings
import logging
import os
from typing import Optional, BinaryIO, Dict

logger = logging.getLogger(__name__)


class S3Storage:
    """S3/MinIO storage handler for data lake files"""

    def __init__(self):
        """Initialize S3 client with MinIO configuration"""
        self.client = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
            config=Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION),
            use_ssl=settings.AWS_S3_USE_SSL
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket '{self.bucket_name}' exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Created bucket '{self.bucket_name}'")
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
            else:
                logger.error(f"Error checking bucket: {e}")

    def upload_file(
        self,
        file_obj: BinaryIO,
        object_name: str,
        workspace_id: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Upload a file to S3/MinIO

        Args:
            file_obj: File object to upload
            object_name: Name for the object in S3
            workspace_id: Workspace ID for organizing files
            metadata: Optional metadata to attach to the object

        Returns:
            S3 object URL
        """
        # Organize files by workspace
        s3_key = f"workspace_{workspace_id}/{object_name}"

        extra_args = {}
        if metadata:
            extra_args['Metadata'] = metadata

        try:
            self.client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            logger.info(f"Successfully uploaded {s3_key} to {self.bucket_name}")

            # Return the S3 URL
            return f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{s3_key}"

        except ClientError as e:
            logger.error(f"Failed to upload file: {e}")
            raise

    def download_file(self, object_name: str, workspace_id: str, local_path: str):
        """
        Download a file from S3/MinIO

        Args:
            object_name: Name of the object in S3
            workspace_id: Workspace ID
            local_path: Local path to save the file
        """
        s3_key = f"workspace_{workspace_id}/{object_name}"

        try:
            self.client.download_file(self.bucket_name, s3_key, local_path)
            logger.info(f"Successfully downloaded {s3_key} to {local_path}")
        except ClientError as e:
            logger.error(f"Failed to download file: {e}")
            raise

    def get_presigned_url(
        self,
        object_name: str,
        workspace_id: str,
        expiration: int = 3600,
        http_method: str = 'get_object'
    ) -> str:
        """
        Generate a presigned URL for file access

        Args:
            object_name: Name of the object in S3
            workspace_id: Workspace ID
            expiration: URL expiration time in seconds (default 1 hour)
            http_method: HTTP method ('get_object' or 'put_object')

        Returns:
            Presigned URL
        """
        s3_key = f"workspace_{workspace_id}/{object_name}"

        try:
            url = self.client.generate_presigned_url(
                http_method,
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            logger.info(f"Generated presigned URL for {s3_key}")
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    def delete_file(self, object_name: str, workspace_id: str):
        """
        Delete a file from S3/MinIO

        Args:
            object_name: Name of the object in S3
            workspace_id: Workspace ID
        """
        s3_key = f"workspace_{workspace_id}/{object_name}"

        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Successfully deleted {s3_key}")
        except ClientError as e:
            logger.error(f"Failed to delete file: {e}")
            raise

    def list_files(self, workspace_id: str, prefix: str = '') -> list:
        """
        List files in a workspace

        Args:
            workspace_id: Workspace ID
            prefix: Optional prefix to filter files

        Returns:
            List of file objects
        """
        s3_prefix = f"workspace_{workspace_id}/{prefix}"

        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=s3_prefix
            )

            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'],
                        'etag': obj['ETag']
                    })

            return files
        except ClientError as e:
            logger.error(f"Failed to list files: {e}")
            raise

    def get_file_metadata(self, object_name: str, workspace_id: str) -> Dict:
        """
        Get metadata for a file

        Args:
            object_name: Name of the object in S3
            workspace_id: Workspace ID

        Returns:
            File metadata dictionary
        """
        s3_key = f"workspace_{workspace_id}/{object_name}"

        try:
            response = self.client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return {
                'size': response['ContentLength'],
                'content_type': response.get('ContentType'),
                'last_modified': response['LastModified'],
                'metadata': response.get('Metadata', {}),
                'etag': response['ETag']
            }
        except ClientError as e:
            logger.error(f"Failed to get file metadata: {e}")
            raise

    def copy_file(
        self,
        source_object: str,
        dest_object: str,
        workspace_id: str
    ):
        """
        Copy a file within the same bucket

        Args:
            source_object: Source object name
            dest_object: Destination object name
            workspace_id: Workspace ID
        """
        source_key = f"workspace_{workspace_id}/{source_object}"
        dest_key = f"workspace_{workspace_id}/{dest_object}"

        try:
            copy_source = {
                'Bucket': self.bucket_name,
                'Key': source_key
            }
            self.client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=dest_key
            )
            logger.info(f"Successfully copied {source_key} to {dest_key}")
        except ClientError as e:
            logger.error(f"Failed to copy file: {e}")
            raise


# Global storage instance
storage = S3Storage()

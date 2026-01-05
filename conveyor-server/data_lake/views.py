from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from .models import File, Folder, Schema, StorageZone
from .serializers import (
    FileSerializer, FolderSerializer, SchemaSerializer, SchemaCreateSerializer,
    StorageZoneSerializer, StorageStatsSerializer, FileUploadSerializer
)
from authentication.permissions import IsWorkspaceMember
from django.utils import timezone
from datetime import timedelta
from .storage import storage
import logging

logger = logging.getLogger(__name__)


class FolderViewSet(viewsets.ModelViewSet):
    """ViewSet for Data Lake folders"""
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        """Filter folders by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Folder.objects.none()
        return Folder.objects.filter(workspace_id=workspace_id)

    def perform_create(self, serializer):
        """Create folder with workspace and user"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        """Get folder contents (files and subfolders)"""
        folder = self.get_object()
        files = File.objects.filter(folder=folder)
        subfolders = Folder.objects.filter(parent=folder)

        return Response({
            'files': FileSerializer(files, many=True).data,
            'folders': FolderSerializer(subfolders, many=True).data
        })


class FileViewSet(viewsets.ModelViewSet):
    """ViewSet for Data Lake files"""
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        """Filter files by workspace with search and filters"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return File.objects.none()

        queryset = File.objects.filter(workspace_id=workspace_id)

        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(path__icontains=search)
            )

        # Format filter
        format_filter = self.request.query_params.get('format', None)
        if format_filter:
            queryset = queryset.filter(format=format_filter)

        # Folder filter
        folder_id = self.request.query_params.get('folder', None)
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)

        return queryset.select_related('folder', 'schema', 'uploaded_by')

    def perform_create(self, serializer):
        """Create file with workspace and user"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            uploaded_by=self.request.user
        )

    def perform_destroy(self, instance):
        """Delete file from S3 before deleting record"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        try:
            # Delete from S3/MinIO storage
            storage.delete_file(
                object_name=instance.name,
                workspace_id=workspace_id
            )
            logger.info(f"Deleted file from storage: {instance.name}")
        except Exception as e:
            logger.error(f"Failed to delete file from storage: {str(e)}")
            # Continue with record deletion even if S3 deletion fails

        # Delete the database record
        instance.delete()

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a file to the data lake"""
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = request.headers.get('X-Workspace-ID')
        uploaded_file = serializer.validated_data['file']
        name = serializer.validated_data.get('name', uploaded_file.name)
        folder_id = serializer.validated_data.get('folder')
        file_format = serializer.validated_data.get('format', 'csv')
        schema_id = serializer.validated_data.get('schema')

        # Determine path
        folder = None
        if folder_id:
            folder = get_object_or_404(Folder, id=folder_id, workspace_id=workspace_id)
            path = f"{folder.path}/{name}"
        else:
            path = f"/lakehouse/{name}"

        try:
            # Upload to S3/MinIO storage
            metadata = {
                'format': file_format,
                'uploaded_by': str(request.user.id),
                'original_name': uploaded_file.name
            }

            storage_url = storage.upload_file(
                file_obj=uploaded_file,
                object_name=name,
                workspace_id=workspace_id,
                metadata=metadata
            )

            # Create file record
            file_obj = File.objects.create(
                workspace_id=workspace_id,
                folder=folder,
                name=name,
                path=path,
                format=file_format,
                size=uploaded_file.size,
                storage_url=storage_url,
                uploaded_by=request.user,
                schema_id=schema_id if schema_id else None
            )

            logger.info(f"File uploaded successfully: {name} to workspace {workspace_id}")

            return Response(
                FileSerializer(file_obj).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Failed to upload file: {str(e)}")
            return Response(
                {'error': f'Failed to upload file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a file from the data lake"""
        file_obj = self.get_object()
        workspace_id = request.headers.get('X-Workspace-ID')

        try:
            # Generate presigned URL for download
            download_url = storage.get_presigned_url(
                object_name=file_obj.name,
                workspace_id=workspace_id,
                expiration=3600,  # 1 hour
                http_method='get_object'
            )

            return Response({
                'id': str(file_obj.id),
                'name': file_obj.name,
                'download_url': download_url,
                'size': file_obj.size,
                'format': file_obj.format,
                'expires_in': 3600
            })

        except Exception as e:
            logger.error(f"Failed to generate download URL: {str(e)}")
            return Response(
                {'error': f'Failed to generate download URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview file contents (first few rows)"""
        file_obj = self.get_object()
        workspace_id = request.headers.get('X-Workspace-ID')
        max_rows = int(request.query_params.get('rows', 100))

        preview_data = []
        columns = []
        error = None

        try:
            # Get file content from storage
            file_content = storage.get_file(
                object_name=file_obj.name,
                workspace_id=workspace_id
            )

            if file_obj.format == 'csv':
                import csv
                import io
                
                # Read CSV content
                content = file_content.read().decode('utf-8')
                reader = csv.reader(io.StringIO(content))
                rows = list(reader)
                
                if rows:
                    columns = rows[0]
                    preview_data = rows[1:max_rows+1]

            elif file_obj.format == 'json':
                import json
                
                content = file_content.read().decode('utf-8')
                data = json.loads(content)
                
                if isinstance(data, list) and data:
                    if isinstance(data[0], dict):
                        columns = list(data[0].keys())
                        preview_data = [list(row.values()) for row in data[:max_rows]]
                    else:
                        columns = ['value']
                        preview_data = [[item] for item in data[:max_rows]]
                elif isinstance(data, dict):
                    columns = list(data.keys())
                    preview_data = [list(data.values())]

            elif file_obj.format == 'parquet':
                try:
                    import pyarrow.parquet as pq
                    import tempfile
                    import os
                    
                    # Save to temp file and read with pyarrow
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.parquet') as tmp:
                        tmp.write(file_content.read())
                        tmp_path = tmp.name
                    
                    table = pq.read_table(tmp_path)
                    df = table.to_pandas()
                    os.unlink(tmp_path)
                    
                    columns = df.columns.tolist()
                    preview_data = df.head(max_rows).values.tolist()
                except ImportError:
                    error = "Parquet preview requires pyarrow package"

            elif file_obj.format in ['jsonl', 'ndjson']:
                import json
                
                content = file_content.read().decode('utf-8')
                lines = content.strip().split('\n')
                
                for line in lines[:max_rows]:
                    if line.strip():
                        row = json.loads(line)
                        if isinstance(row, dict):
                            if not columns:
                                columns = list(row.keys())
                            preview_data.append([row.get(col) for col in columns])

            elif file_obj.format == 'tsv':
                import csv
                import io
                
                content = file_content.read().decode('utf-8')
                reader = csv.reader(io.StringIO(content), delimiter='\t')
                rows = list(reader)
                
                if rows:
                    columns = rows[0]
                    preview_data = rows[1:max_rows+1]

            else:
                # Try to read as plain text for unknown formats
                content = file_content.read()
                try:
                    text = content.decode('utf-8')
                    lines = text.split('\n')[:max_rows]
                    columns = ['content']
                    preview_data = [[line] for line in lines]
                except UnicodeDecodeError:
                    error = f"Cannot preview binary file format: {file_obj.format}"

        except Exception as e:
            logger.error(f"Failed to preview file: {str(e)}")
            error = str(e)

        return Response({
            'id': str(file_obj.id),
            'name': file_obj.name,
            'format': file_obj.format,
            'rows': file_obj.rows,
            'columns': columns if not error else file_obj.columns,
            'preview_data': preview_data,
            'preview_rows': len(preview_data),
            'error': error
        })


class SchemaViewSet(viewsets.ModelViewSet):
    """ViewSet for Data Lake schemas"""
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        """Use different serializer for create"""
        if self.action == 'create':
            return SchemaCreateSerializer
        return SchemaSerializer

    def get_queryset(self):
        """Filter schemas by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Schema.objects.none()

        queryset = Schema.objects.filter(workspace_id=workspace_id)

        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset.select_related('created_by')

    def perform_create(self, serializer):
        """Create schema with workspace and user"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a schema"""
        original = self.get_object()
        workspace_id = request.headers.get('X-Workspace-ID')

        # Create a copy with incremented version or _copy suffix
        new_name = request.data.get('name', f"{original.name}_copy")
        new_version = request.data.get('version', 'v1.0')

        duplicate = Schema.objects.create(
            workspace_id=workspace_id,
            name=new_name,
            description=original.description,
            version=new_version,
            schema_definition=original.schema_definition,
            created_by=request.user
        )

        return Response(
            SchemaSerializer(duplicate).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def tables(self, request, pk=None):
        """Get all tables/files using this schema"""
        schema = self.get_object()
        files = schema.files.all()
        return Response(FileSerializer(files, many=True).data)


class StorageZoneViewSet(viewsets.ModelViewSet):
    """ViewSet for Storage Zones"""
    serializer_class = StorageZoneSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        """Filter storage zones by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return StorageZone.objects.none()
        return StorageZone.objects.filter(workspace_id=workspace_id)

    def perform_create(self, serializer):
        """Create storage zone with workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)

    @action(detail=True, methods=['post'])
    def update_metrics(self, request, pk=None):
        """Update storage zone metrics"""
        zone = self.get_object()
        used_storage = request.data.get('used_storage')

        if used_storage is not None:
            zone.used_storage = used_storage
            zone.save()

        return Response(StorageZoneSerializer(zone).data)


class StorageStatsViewSet(viewsets.ViewSet):
    """ViewSet for overall storage statistics"""
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def list(self, request):
        """Get overall storage statistics"""
        workspace_id = request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Response({
                'total_files': 0,
                'total_folders': 0,
                'total_size': 0,
                'total_size_display': '0 B',
                'files_by_format': {},
                'recent_files': []
            })

        # Get statistics
        files = File.objects.filter(workspace_id=workspace_id)
        folders = Folder.objects.filter(workspace_id=workspace_id)

        total_files = files.count()
        total_folders = folders.count()
        total_size = files.aggregate(total=Sum('size'))['total'] or 0

        # Files by format
        files_by_format = {}
        for file_format, _ in File.FORMAT_CHOICES:
            count = files.filter(format=file_format).count()
            if count > 0:
                files_by_format[file_format] = count

        # Recent files
        recent_files = files.order_by('-created_at')[:10]

        # Convert size to human-readable
        size = total_size
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                total_size_display = f"{size:.1f} {unit}"
                break
            size /= 1024.0
        else:
            total_size_display = f"{size:.1f} PB"

        data = {
            'total_files': total_files,
            'total_folders': total_folders,
            'total_size': total_size,
            'total_size_display': total_size_display,
            'files_by_format': files_by_format,
            'recent_files': FileSerializer(recent_files, many=True).data
        }

        serializer = StorageStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics"""
        workspace_id = request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Response({})

        files = File.objects.filter(workspace_id=workspace_id)
        folders = Folder.objects.filter(workspace_id=workspace_id)
        schemas = Schema.objects.filter(workspace_id=workspace_id)
        zones = StorageZone.objects.filter(workspace_id=workspace_id)

        # Calculate totals
        total_files = files.count()
        total_folders = folders.count()
        total_schemas = schemas.count()
        total_size = files.aggregate(total=Sum('size'))['total'] or 0

        # Recent activity
        recent_files = files.order_by('-created_at')[:5]

        # Storage distribution by format
        storage_by_format = {}
        for file_format, label in File.FORMAT_CHOICES:
            format_files = files.filter(format=file_format)
            format_size = format_files.aggregate(total=Sum('size'))['total'] or 0
            if format_size > 0:
                storage_by_format[file_format] = {
                    'count': format_files.count(),
                    'size': format_size,
                    'percentage': (format_size / total_size * 100) if total_size > 0 else 0
                }

        # Convert size to human-readable
        def format_size(size):
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} PB"

        return Response({
            'stats': {
                'total_files': total_files,
                'total_folders': total_folders,
                'total_schemas': total_schemas,
                'total_size': total_size,
                'total_size_display': format_size(total_size)
            },
            'recent_files': FileSerializer(recent_files, many=True).data,
            'storage_by_format': storage_by_format,
            'storage_zones': StorageZoneSerializer(zones, many=True).data
        })

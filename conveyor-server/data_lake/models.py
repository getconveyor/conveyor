from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
import uuid

User = get_user_model()


class Folder(models.Model):
    """Data Lake folder for organizing files"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='data_lake_folders')
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=1024)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_folders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['workspace', 'path']
        ordering = ['path']

    def __str__(self):
        return self.path

    def get_size(self):
        """Calculate total size of all files in this folder"""
        total = 0
        for file in self.files.all():
            total += file.size
        for subfolder in self.subfolders.all():
            total += subfolder.get_size()
        return total


class File(models.Model):
    """Data Lake file storage"""
    FORMAT_CHOICES = [
        ('parquet', 'Parquet'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('avro', 'Avro'),
        ('orc', 'ORC'),
        ('delta', 'Delta Lake'),
        ('table', 'Table'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='data_lake_files')
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=1024)
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    size = models.BigIntegerField(default=0, help_text='File size in bytes')
    rows = models.BigIntegerField(null=True, blank=True, help_text='Number of records')
    columns = models.IntegerField(null=True, blank=True, help_text='Number of columns')
    storage_url = models.CharField(max_length=1024, blank=True, help_text='S3/MinIO storage URL')

    # Metadata
    schema = models.ForeignKey('Schema', on_delete=models.SET_NULL, null=True, blank=True, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['workspace', 'path']
        ordering = ['-created_at']

    def __str__(self):
        return self.path

    def get_size_display(self):
        """Return human-readable file size"""
        size = self.size
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"


class Schema(models.Model):
    """Data Lake schema definition"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='data_lake_schemas')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=50, default='v1.0')

    # Schema definition (could be JSON schema or similar)
    schema_definition = models.JSONField(default=dict, blank=True, help_text='JSON schema definition')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_schemas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['workspace', 'name', 'version']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.version})"

    @property
    def tables(self):
        """Count of tables using this schema"""
        return self.files.count()

    @property
    def columns(self):
        """Total columns across all files"""
        return sum(f.columns or 0 for f in self.files.all())


class StorageZone(models.Model):
    """Storage zone configuration for tiered storage"""
    ZONE_TYPE_CHOICES = [
        ('hot', 'Hot Storage - SSD'),
        ('warm', 'Warm Storage - HDD'),
        ('cold', 'Cold Storage - Archive'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='storage_zones')
    name = models.CharField(max_length=255)
    zone_type = models.CharField(max_length=20, choices=ZONE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Storage metrics
    total_capacity = models.BigIntegerField(help_text='Total capacity in bytes')
    used_storage = models.BigIntegerField(default=0, help_text='Used storage in bytes')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['zone_type']

    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()})"

    @property
    def available_storage(self):
        """Calculate available storage"""
        return self.total_capacity - self.used_storage

    @property
    def usage_percentage(self):
        """Calculate usage percentage"""
        if self.total_capacity == 0:
            return 0
        return (self.used_storage / self.total_capacity) * 100

    def get_size_display(self, size):
        """Return human-readable size"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"

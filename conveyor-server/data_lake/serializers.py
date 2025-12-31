from rest_framework import serializers
from .models import File, Folder, Schema, StorageZone
from django.contrib.auth import get_user_model

User = get_user_model()


class FolderSerializer(serializers.ModelSerializer):
    """Serializer for Data Lake folders"""
    size = serializers.SerializerMethodField()
    file_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = [
            'id', 'name', 'path', 'parent', 'size', 'file_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_size(self, obj):
        """Get total size of folder"""
        return obj.get_size()

    def get_file_count(self, obj):
        """Get count of files in folder"""
        return obj.files.count()

    def get_created_by_name(self, obj):
        """Get creator name"""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class FileSerializer(serializers.ModelSerializer):
    """Serializer for Data Lake files"""
    size_display = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    schema_name = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            'id', 'name', 'path', 'folder', 'format', 'size', 'size_display',
            'rows', 'columns', 'storage_url', 'schema', 'schema_name',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_size_display(self, obj):
        """Get human-readable file size"""
        return obj.get_size_display()

    def get_uploaded_by_name(self, obj):
        """Get uploader name"""
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.email
        return None

    def get_schema_name(self, obj):
        """Get schema name"""
        return str(obj.schema) if obj.schema else None


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload"""
    file = serializers.FileField()
    name = serializers.CharField(max_length=255, required=False)
    folder = serializers.UUIDField(required=False, allow_null=True)
    format = serializers.ChoiceField(choices=File.FORMAT_CHOICES, required=False)
    schema = serializers.UUIDField(required=False, allow_null=True)


class SchemaSerializer(serializers.ModelSerializer):
    """Serializer for Data Lake schemas"""
    tables = serializers.ReadOnlyField()
    columns = serializers.ReadOnlyField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Schema
        fields = [
            'id', 'name', 'description', 'version', 'schema_definition',
            'tables', 'columns', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        """Get creator name"""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class SchemaCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating schemas"""
    class Meta:
        model = Schema
        fields = ['name', 'description', 'version', 'schema_definition']


class StorageZoneSerializer(serializers.ModelSerializer):
    """Serializer for Storage Zones"""
    available_storage = serializers.ReadOnlyField()
    usage_percentage = serializers.ReadOnlyField()
    file_count = serializers.SerializerMethodField()
    total_capacity_display = serializers.SerializerMethodField()
    used_storage_display = serializers.SerializerMethodField()
    available_storage_display = serializers.SerializerMethodField()

    class Meta:
        model = StorageZone
        fields = [
            'id', 'name', 'zone_type', 'status', 'total_capacity',
            'used_storage', 'available_storage', 'usage_percentage',
            'file_count', 'total_capacity_display', 'used_storage_display',
            'available_storage_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_file_count(self, obj):
        """Get count of files in this zone"""
        # This would need implementation based on how you track files in zones
        return 0

    def get_total_capacity_display(self, obj):
        """Get human-readable total capacity"""
        return obj.get_size_display(obj.total_capacity)

    def get_used_storage_display(self, obj):
        """Get human-readable used storage"""
        return obj.get_size_display(obj.used_storage)

    def get_available_storage_display(self, obj):
        """Get human-readable available storage"""
        return obj.get_size_display(obj.available_storage)


class StorageStatsSerializer(serializers.Serializer):
    """Serializer for overall storage statistics"""
    total_files = serializers.IntegerField()
    total_folders = serializers.IntegerField()
    total_size = serializers.IntegerField()
    total_size_display = serializers.CharField()
    files_by_format = serializers.DictField()
    recent_files = FileSerializer(many=True)

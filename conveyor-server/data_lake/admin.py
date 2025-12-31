from django.contrib import admin
from .models import File, Folder, Schema, StorageZone


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'path', 'workspace', 'created_by', 'created_at']
    list_filter = ['workspace', 'created_at']
    search_fields = ['name', 'path']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ['name', 'path', 'format', 'size', 'workspace', 'uploaded_by', 'created_at']
    list_filter = ['workspace', 'format', 'created_at']
    search_fields = ['name', 'path']
    readonly_fields = ['id', 'created_at', 'updated_at', 'get_size_display']
    date_hierarchy = 'created_at'
    list_per_page = 50


@admin.register(Schema)
class SchemaAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'workspace', 'tables', 'columns', 'created_by', 'created_at']
    list_filter = ['workspace', 'version', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'tables', 'columns', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(StorageZone)
class StorageZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'zone_type', 'status', 'workspace', 'usage_percentage', 'created_at']
    list_filter = ['workspace', 'zone_type', 'status', 'created_at']
    search_fields = ['name']
    readonly_fields = ['id', 'available_storage', 'usage_percentage', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

from django.contrib import admin
from .models import Connection, DataSource, Pipeline, PipelineRun, Schedule


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    """Admin interface for Connection model"""

    list_display = ('name', 'type', 'workspace', 'status', 'created_by', 'created_at', 'last_tested')
    list_filter = ('type', 'status', 'created_at', 'workspace')
    search_fields = ('name', 'host', 'database', 'workspace__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_tested')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'name', 'type', 'status')
        }),
        ('Connection Details', {
            'fields': ('host', 'port', 'database', 'username', 'password_encrypted', 'ssl')
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at', 'last_tested')
        }),
    )


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    """Admin interface for DataSource model"""

    list_display = ('name', 'type', 'workspace', 'connection', 'status', 'record_count', 'last_sync')
    list_filter = ('type', 'status', 'workspace', 'created_at')
    search_fields = ('name', 'workspace__name', 'connection__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_sync')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'connection', 'name', 'type', 'status')
        }),
        ('Data Details', {
            'fields': ('tables', 'record_count', 'last_sync')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    """Admin interface for Pipeline model"""

    list_display = ('name', 'workspace', 'status', 'source_connection', 'destination_connection',
                   'run_count', 'success_rate', 'last_run', 'next_run')
    list_filter = ('status', 'workspace', 'created_at')
    search_fields = ('name', 'description', 'workspace__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_run', 'next_run',
                      'run_count', 'success_rate', 'records_processed')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'name', 'description', 'status')
        }),
        ('Connections', {
            'fields': ('source_connection', 'destination_connection')
        }),
        ('Scheduling', {
            'fields': ('schedule', 'last_run', 'next_run')
        }),
        ('Statistics', {
            'fields': ('run_count', 'success_rate', 'records_processed'),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(PipelineRun)
class PipelineRunAdmin(admin.ModelAdmin):
    """Admin interface for PipelineRun model"""

    list_display = ('id', 'pipeline', 'status', 'start_time', 'end_time', 'duration',
                   'records_processed', 'triggered_by', 'triggered_by_user')
    list_filter = ('status', 'triggered_by', 'created_at')
    search_fields = ('pipeline__name', 'triggered_by_user__username')
    readonly_fields = ('id', 'created_at', 'start_time', 'end_time', 'duration')

    fieldsets = (
        ('Run Information', {
            'fields': ('id', 'pipeline', 'status', 'triggered_by', 'triggered_by_user')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration')
        }),
        ('Metrics', {
            'fields': ('records_processed', 'bytes_processed', 'metrics'),
            'classes': ('collapse',)
        }),
        ('Errors', {
            'fields': ('errors',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """Admin interface for Schedule model"""

    list_display = ('name', 'pipeline', 'workspace', 'cron_expression', 'timezone',
                   'enabled', 'last_run', 'next_run')
    list_filter = ('enabled', 'workspace', 'created_at')
    search_fields = ('name', 'pipeline__name', 'workspace__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_run')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'pipeline', 'name', 'enabled')
        }),
        ('Schedule Configuration', {
            'fields': ('cron_expression', 'timezone', 'next_run', 'last_run')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )

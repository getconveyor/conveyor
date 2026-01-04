from django.contrib import admin
from .models import Transformation, TransformationRule, DataQualityCheck, DataQualityResult, Notebook


class TransformationRuleInline(admin.TabularInline):
    """Inline admin for transformation rules"""
    model = TransformationRule
    extra = 0
    fields = ('name', 'rule_type', 'enabled', 'order')


@admin.register(Transformation)
class TransformationAdmin(admin.ModelAdmin):
    """Admin interface for Transformation model"""

    list_display = ('name', 'type', 'workspace', 'pipeline', 'status', 'order',
                   'records_processed', 'last_run', 'created_at')
    list_filter = ('type', 'status', 'workspace', 'created_at')
    search_fields = ('name', 'description', 'workspace__name', 'pipeline__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_run',
                      'records_processed', 'avg_execution_time')
    inlines = [TransformationRuleInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'pipeline', 'name', 'description', 'type', 'status')
        }),
        ('Configuration', {
            'fields': ('config', 'input_schema', 'output_schema', 'order')
        }),
        ('Statistics', {
            'fields': ('last_run', 'records_processed', 'avg_execution_time'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(TransformationRule)
class TransformationRuleAdmin(admin.ModelAdmin):
    """Admin interface for TransformationRule model"""

    list_display = ('name', 'transformation', 'rule_type', 'enabled', 'order', 'created_at')
    list_filter = ('rule_type', 'enabled', 'created_at')
    search_fields = ('name', 'description', 'transformation__name')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'transformation', 'name', 'description', 'rule_type')
        }),
        ('Configuration', {
            'fields': ('config', 'enabled', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DataQualityCheck)
class DataQualityCheckAdmin(admin.ModelAdmin):
    """Admin interface for DataQualityCheck model"""

    list_display = ('name', 'check_type', 'workspace', 'pipeline', 'severity',
                   'enabled', 'last_result', 'last_run', 'created_at')
    list_filter = ('check_type', 'severity', 'enabled', 'workspace', 'created_at')
    search_fields = ('name', 'description', 'workspace__name', 'pipeline__name', 'target_table')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_run', 'last_result')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'pipeline', 'name', 'description', 'check_type')
        }),
        ('Check Configuration', {
            'fields': ('target_table', 'target_column', 'rule', 'threshold', 'severity', 'enabled')
        }),
        ('Execution History', {
            'fields': ('last_run', 'last_result'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(DataQualityResult)
class DataQualityResultAdmin(admin.ModelAdmin):
    """Admin interface for DataQualityResult model"""

    list_display = ('quality_check', 'result', 'pass_percentage', 'total_records',
                   'passed_records', 'failed_records', 'execution_time', 'executed_at')
    list_filter = ('result', 'executed_at')
    search_fields = ('quality_check__name', 'error_message')
    readonly_fields = ('id', 'executed_at')

    fieldsets = (
        ('Result Information', {
            'fields': ('id', 'quality_check', 'result', 'executed_at')
        }),
        ('Metrics', {
            'fields': ('total_records', 'passed_records', 'failed_records', 'pass_percentage', 'execution_time')
        }),
        ('Details', {
            'fields': ('error_message', 'details'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    """Admin interface for Notebook model"""

    list_display = ('name', 'language', 'kernel', 'workspace', 'cell_count',
                   'status', 'last_executed', 'created_by', 'created_at', 'updated_at')
    list_filter = ('language', 'status', 'workspace', 'created_at')
    search_fields = ('name', 'description', 'workspace__name', 'created_by__username')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_executed', 'status')

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'workspace', 'name', 'description')
        }),
        ('Configuration', {
            'fields': ('language', 'kernel', 'cell_count', 'status')
        }),
        ('Content', {
            'fields': ('content',),
            'classes': ('collapse',)
        }),
        ('Execution', {
            'fields': ('last_executed',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

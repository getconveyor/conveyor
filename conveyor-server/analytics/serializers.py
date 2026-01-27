"""
Serializers for analytics - dashboards, reports, and data exploration.
"""

from rest_framework import serializers
from .models import (
    Dashboard,
    Widget,
    SavedQuery,
    Report,
    ReportExecution,
    Exploration,
)


class WidgetSerializer(serializers.ModelSerializer):
    """Serializer for dashboard widgets."""
    
    class Meta:
        model = Widget
        fields = [
            'id', 'dashboard', 'name', 'widget_type',
            'query_id', 'query_text', 'data_source',
            'config', 'position_x', 'position_y',
            'width', 'height', 'cache_duration_seconds',
            'last_cached_at', 'cached_data',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_cached_at']


class WidgetCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating widgets."""
    
    class Meta:
        model = Widget
        fields = [
            'id', 'name', 'widget_type',
            'query_id', 'query_text', 'data_source',
            'config', 'position_x', 'position_y',
            'width', 'height', 'cache_duration_seconds',
        ]


class DashboardSerializer(serializers.ModelSerializer):
    """Serializer for dashboards."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    widget_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'workspace', 'name', 'description', 'slug',
            'layout', 'theme', 'auto_refresh', 'refresh_interval_seconds',
            'is_public', 'is_template',
            'owner', 'owner_name', 'created_by', 'created_by_name',
            'view_count', 'last_viewed_at',
            'created_at', 'updated_at', 'widget_count',
        ]
        read_only_fields = ['created_at', 'updated_at', 'view_count', 'last_viewed_at']
    
    def get_widget_count(self, obj):
        return obj.widgets.count()


class DashboardDetailSerializer(DashboardSerializer):
    """Detailed dashboard serializer with widgets."""
    widgets = WidgetSerializer(many=True, read_only=True)
    
    class Meta(DashboardSerializer.Meta):
        fields = DashboardSerializer.Meta.fields + ['widgets']


class SavedQuerySerializer(serializers.ModelSerializer):
    """Serializer for saved queries."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    
    class Meta:
        model = SavedQuery
        fields = [
            'id', 'workspace', 'name', 'description',
            'query_text', 'namespace', 'schema_name',
            'parameters', 'tags', 'folder',
            'is_public', 'owner', 'owner_name',
            'execution_count', 'last_executed_at', 'avg_execution_time_ms',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'execution_count',
            'last_executed_at', 'avg_execution_time_ms',
        ]


class ReportExecutionSerializer(serializers.ModelSerializer):
    """Serializer for report executions."""
    
    class Meta:
        model = ReportExecution
        fields = [
            'id', 'report', 'status',
            'started_at', 'completed_at', 'duration_ms',
            'file_url', 'file_size_bytes',
            'delivered', 'delivery_error', 'error_message',
            'created_at',
        ]
        read_only_fields = ['created_at']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for reports."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    dashboard_name = serializers.CharField(source='dashboard.name', read_only=True)
    query_name = serializers.CharField(source='query.name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'workspace', 'name', 'description',
            'source_type', 'dashboard', 'dashboard_name',
            'query', 'query_name', 'format',
            'schedule', 'timezone', 'enabled',
            'delivery_method', 'delivery_config',
            'last_generated_at', 'last_delivered_at', 'next_run_at',
            'owner', 'owner_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at',
            'last_generated_at', 'last_delivered_at',
        ]


class ReportDetailSerializer(ReportSerializer):
    """Detailed report serializer with recent executions."""
    recent_executions = serializers.SerializerMethodField()
    
    class Meta(ReportSerializer.Meta):
        fields = ReportSerializer.Meta.fields + ['recent_executions']
    
    def get_recent_executions(self, obj):
        executions = obj.executions.order_by('-created_at')[:5]
        return ReportExecutionSerializer(executions, many=True).data


class ExplorationSerializer(serializers.ModelSerializer):
    """Serializer for data explorations."""
    user_name = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Exploration
        fields = [
            'id', 'workspace', 'user', 'user_name',
            'name', 'state', 'source_type', 'source_reference',
            'cell_count', 'last_cell_executed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'cell_count', 'last_cell_executed_at']


class DashboardSummarySerializer(serializers.Serializer):
    """Serializer for dashboard summary."""
    total_dashboards = serializers.IntegerField()
    public_dashboards = serializers.IntegerField()
    template_dashboards = serializers.IntegerField()
    total_widgets = serializers.IntegerField()
    most_viewed = serializers.ListField()


class QuerySummarySerializer(serializers.Serializer):
    """Serializer for query summary."""
    total_queries = serializers.IntegerField()
    public_queries = serializers.IntegerField()
    total_executions = serializers.IntegerField()
    avg_execution_time_ms = serializers.FloatField()


class ReportSummarySerializer(serializers.Serializer):
    """Serializer for report summary."""
    total_reports = serializers.IntegerField()
    enabled_reports = serializers.IntegerField()
    reports_by_format = serializers.DictField()
    reports_by_delivery = serializers.DictField()

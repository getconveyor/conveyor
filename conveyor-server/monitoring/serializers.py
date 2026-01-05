"""
Serializers for monitoring models.
"""

from rest_framework import serializers
from .models import SystemHealth, Alert, AuditLog, MetricSnapshot


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for system health status."""
    
    class Meta:
        model = SystemHealth
        fields = [
            'id', 'service', 'status', 'response_time_ms',
            'cpu_usage', 'memory_usage', 'disk_usage',
            'details', 'error_message', 'checked_at'
        ]
        read_only_fields = ['id', 'checked_at']


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for system alerts."""
    
    acknowledged_by_email = serializers.EmailField(
        source='acknowledged_by.email', 
        read_only=True
    )
    
    class Meta:
        model = Alert
        fields = [
            'id', 'workspace', 'severity', 'alert_type',
            'title', 'message', 'source', 'source_id',
            'metadata', 'status', 'acknowledged_by',
            'acknowledged_by_email', 'acknowledged_at',
            'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating alert status."""
    
    class Meta:
        model = Alert
        fields = ['status']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'workspace', 'user', 'user_email',
            'action', 'resource_type', 'resource_id',
            'resource_name', 'ip_address', 'user_agent',
            'request_id', 'changes', 'metadata',
            'status', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MetricSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for metric snapshots."""
    
    class Meta:
        model = MetricSnapshot
        fields = [
            'id', 'workspace', 'metric_type', 'value',
            'unit', 'period', 'period_start', 'period_end',
            'dimensions', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SystemOverviewSerializer(serializers.Serializer):
    """Serializer for system overview dashboard."""
    
    total_pipelines = serializers.IntegerField()
    running_pipelines = serializers.IntegerField()
    failed_pipelines = serializers.IntegerField()
    total_sources = serializers.IntegerField()
    active_sources = serializers.IntegerField()
    queries_today = serializers.IntegerField()
    storage_used_bytes = serializers.IntegerField()
    records_processed = serializers.IntegerField()

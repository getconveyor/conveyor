"""
Serializers for streaming/real-time analytics.
"""

from rest_framework import serializers
from .models import (
    StreamSource,
    StreamPipeline,
    StreamCheckpoint,
    StreamEvent,
    StreamAlert,
)


class StreamSourceSerializer(serializers.ModelSerializer):
    """Serializer for stream sources."""
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = StreamSource
        fields = [
            'id', 'workspace', 'name', 'description', 'source_type',
            'connection_config', 'schema_config',
            'status', 'error_message', 'metrics',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'status', 'error_message']
        extra_kwargs = {
            'connection_config': {'write_only': True},  # Don't expose credentials
        }


class StreamSourceDetailSerializer(StreamSourceSerializer):
    """Detailed serializer with connection config for authorized users."""
    class Meta(StreamSourceSerializer.Meta):
        extra_kwargs = {}  # Show connection_config for detail view


class StreamPipelineSerializer(serializers.ModelSerializer):
    """Serializer for stream pipelines."""
    source_name = serializers.CharField(source='source.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = StreamPipeline
        fields = [
            'id', 'workspace', 'name', 'description',
            'source', 'source_name',
            'transformations', 'destination_config',
            'parallelism', 'checkpoint_interval_ms',
            'status', 'error_message', 'started_at', 'stopped_at',
            'metrics', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'status', 'error_message',
            'started_at', 'stopped_at', 'metrics',
        ]


class StreamCheckpointSerializer(serializers.ModelSerializer):
    """Serializer for stream checkpoints."""
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    
    class Meta:
        model = StreamCheckpoint
        fields = [
            'id', 'pipeline', 'pipeline_name',
            'checkpoint_id', 'state', 'offset',
            'created_at',
        ]
        read_only_fields = ['created_at']


class StreamEventSerializer(serializers.ModelSerializer):
    """Serializer for stream events."""
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    
    class Meta:
        model = StreamEvent
        fields = [
            'id', 'pipeline', 'pipeline_name',
            'event_type', 'event_data', 'event_time',
            'processing_time', 'watermark',
            'created_at',
        ]
        read_only_fields = ['created_at']


class StreamAlertSerializer(serializers.ModelSerializer):
    """Serializer for stream alerts."""
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    
    class Meta:
        model = StreamAlert
        fields = [
            'id', 'workspace', 'pipeline', 'pipeline_name',
            'name', 'description', 'condition',
            'threshold', 'window_size_seconds',
            'severity', 'notification_channels',
            'is_active', 'last_triggered', 'trigger_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_triggered', 'trigger_count']


class StreamMetricsSerializer(serializers.Serializer):
    """Serializer for stream metrics."""
    throughput_per_second = serializers.FloatField()
    latency_ms = serializers.FloatField()
    records_processed = serializers.IntegerField()
    records_failed = serializers.IntegerField()
    backpressure = serializers.FloatField()
    checkpoint_duration_ms = serializers.FloatField()
    uptime_seconds = serializers.IntegerField()


class StreamDashboardSerializer(serializers.Serializer):
    """Serializer for stream dashboard overview."""
    total_pipelines = serializers.IntegerField()
    running_pipelines = serializers.IntegerField()
    failed_pipelines = serializers.IntegerField()
    total_sources = serializers.IntegerField()
    active_sources = serializers.IntegerField()
    total_throughput = serializers.FloatField()
    avg_latency_ms = serializers.FloatField()
    active_alerts = serializers.IntegerField()

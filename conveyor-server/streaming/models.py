"""
Real-time streaming models for stream processing and event-driven pipelines.
"""

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
from integration.models import Source
import uuid

User = get_user_model()


class StreamSource(models.Model):
    """
    Streaming data source configuration (Kafka, Kinesis, etc.).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='stream_sources')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    TYPE_CHOICES = [
        ('kafka', 'Apache Kafka'),
        ('kinesis', 'AWS Kinesis'),
        ('pubsub', 'Google Pub/Sub'),
        ('eventhub', 'Azure Event Hub'),
        ('webhook', 'Webhook'),
        ('websocket', 'WebSocket'),
    ]
    source_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    # Connection details (encrypted)
    connection_config = models.JSONField(default=dict)
    
    # Topic/stream configuration
    topic = models.CharField(max_length=255, blank=True)
    consumer_group = models.CharField(max_length=255, blank=True)
    
    # Schema
    schema_type = models.CharField(max_length=50, blank=True)  # avro, json, protobuf
    schema_registry_url = models.URLField(blank=True)
    schema_definition = models.JSONField(default=dict, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    
    last_connected = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_stream_sources')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stream_sources'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['source_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.source_type})"


class StreamPipeline(models.Model):
    """
    Real-time streaming pipeline configuration.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='stream_pipelines')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Source
    source = models.ForeignKey(StreamSource, on_delete=models.CASCADE, related_name='pipelines')
    
    # Destination
    DESTINATION_TYPE_CHOICES = [
        ('lakehouse', 'Lakehouse'),
        ('database', 'Database'),
        ('stream', 'Stream'),
        ('webhook', 'Webhook'),
    ]
    destination_type = models.CharField(max_length=20, choices=DESTINATION_TYPE_CHOICES)
    destination_config = models.JSONField(default=dict)
    
    # Processing configuration
    processing_config = models.JSONField(default=dict)  # Window size, watermarks, etc.
    
    # Transformations
    transformations = models.JSONField(default=list, blank=True)
    
    STATUS_CHOICES = [
        ('stopped', 'Stopped'),
        ('starting', 'Starting'),
        ('running', 'Running'),
        ('stopping', 'Stopping'),
        ('error', 'Error'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='stopped')
    
    # Runtime info
    started_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    worker_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Metrics
    messages_processed = models.BigIntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)
    error_count = models.IntegerField(default=0)
    last_error = models.TextField(blank=True, null=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_stream_pipelines')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stream_pipelines'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['source']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.status})"


class StreamCheckpoint(models.Model):
    """
    Checkpoints for stream processing state management.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(StreamPipeline, on_delete=models.CASCADE, related_name='checkpoints')
    
    # Offset tracking
    partition = models.IntegerField(default=0)
    offset = models.BigIntegerField()
    timestamp = models.DateTimeField()
    
    # State data
    state_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stream_checkpoints'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pipeline', 'partition', '-created_at']),
        ]
        get_latest_by = 'created_at'
    
    def __str__(self):
        return f"{self.pipeline.name} - Partition {self.partition}: {self.offset}"


class StreamEvent(models.Model):
    """
    Stores stream events for debugging and replay.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(StreamPipeline, on_delete=models.CASCADE, related_name='events')
    
    # Event metadata
    event_id = models.CharField(max_length=255)
    event_type = models.CharField(max_length=100, blank=True)
    event_time = models.DateTimeField()
    
    # Event data
    key = models.TextField(blank=True, null=True)
    payload = models.JSONField()
    headers = models.JSONField(default=dict, blank=True)
    
    # Source metadata
    partition = models.IntegerField(null=True, blank=True)
    offset = models.BigIntegerField(null=True, blank=True)
    
    # Processing status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stream_events'
        ordering = ['-event_time']
        indexes = [
            models.Index(fields=['pipeline', '-event_time']),
            models.Index(fields=['event_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.event_type}: {self.event_id}"


class StreamAlert(models.Model):
    """
    Alerts and anomalies detected in stream processing.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(StreamPipeline, on_delete=models.CASCADE, related_name='alerts')
    
    ALERT_TYPE_CHOICES = [
        ('lag', 'Consumer Lag'),
        ('throughput', 'Throughput Drop'),
        ('error_rate', 'High Error Rate'),
        ('latency', 'High Latency'),
        ('anomaly', 'Data Anomaly'),
        ('schema', 'Schema Change'),
    ]
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    
    # Metrics at alert time
    metric_value = models.FloatField(null=True, blank=True)
    threshold = models.FloatField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stream_alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pipeline', 'status', '-created_at']),
            models.Index(fields=['alert_type', 'severity']),
        ]
    
    def __str__(self):
        return f"[{self.severity}] {self.alert_type}: {self.message[:50]}"


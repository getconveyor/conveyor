"""
Monitoring models for system health, alerts, and audit logging.
"""

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
import uuid

User = get_user_model()


class SystemHealth(models.Model):
    """
    Tracks system health metrics and status.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    SERVICE_CHOICES = [
        ('api', 'API Server'),
        ('celery', 'Celery Worker'),
        ('database', 'Database'),
        ('redis', 'Redis'),
        ('minio', 'MinIO'),
        ('trino', 'Trino'),
        ('hive_metastore', 'Hive Metastore'),
    ]
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('degraded', 'Degraded'),
        ('unhealthy', 'Unhealthy'),
        ('unknown', 'Unknown'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unknown')
    
    # Metrics
    response_time_ms = models.IntegerField(null=True, blank=True)
    cpu_usage = models.FloatField(null=True, blank=True)
    memory_usage = models.FloatField(null=True, blank=True)
    disk_usage = models.FloatField(null=True, blank=True)
    
    # Additional details
    details = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    checked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_health'
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['service', '-checked_at']),
            models.Index(fields=['status']),
        ]
        get_latest_by = 'checked_at'
    
    def __str__(self):
        return f"{self.service}: {self.status}"


class Alert(models.Model):
    """
    System alerts and notifications.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, 
        on_delete=models.CASCADE, 
        related_name='alerts',
        null=True,
        blank=True
    )
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    TYPE_CHOICES = [
        ('pipeline_failure', 'Pipeline Failure'),
        ('connection_error', 'Connection Error'),
        ('performance', 'Performance Issue'),
        ('security', 'Security Alert'),
        ('system', 'System Alert'),
        ('quota', 'Quota Warning'),
    ]
    alert_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Context
    source = models.CharField(max_length=100, blank=True)  # e.g., pipeline_id, connector_type
    source_id = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    acknowledged_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status', '-created_at']),
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['alert_type']),
        ]
    
    def __str__(self):
        return f"[{self.severity}] {self.title}"


class AuditLog(models.Model):
    """
    Audit log for tracking user actions and system events.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, 
        on_delete=models.CASCADE, 
        related_name='audit_logs',
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    
    # Action details
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('execute', 'Execute'),
        ('export', 'Export'),
        ('import', 'Import'),
    ]
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    resource_type = models.CharField(max_length=100)  # e.g., 'pipeline', 'source', 'query'
    resource_id = models.CharField(max_length=255, blank=True)
    resource_name = models.CharField(max_length=255, blank=True)
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.CharField(max_length=255, blank=True)
    
    # Change details
    changes = models.JSONField(default=dict, blank=True)  # Before/after values
    metadata = models.JSONField(default=dict, blank=True)
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', 'resource_type']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'System'
        return f"{user_str}: {self.action} {self.resource_type}"


class MetricSnapshot(models.Model):
    """
    Stores periodic metric snapshots for historical analysis.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, 
        on_delete=models.CASCADE, 
        related_name='metric_snapshots',
        null=True,
        blank=True
    )
    
    METRIC_TYPE_CHOICES = [
        ('pipeline_runs', 'Pipeline Runs'),
        ('records_processed', 'Records Processed'),
        ('storage_usage', 'Storage Usage'),
        ('query_count', 'Query Count'),
        ('api_requests', 'API Requests'),
        ('error_rate', 'Error Rate'),
    ]
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPE_CHOICES)
    
    # Metric values
    value = models.FloatField()
    unit = models.CharField(max_length=20, blank=True)  # e.g., 'count', 'bytes', 'percent'
    
    # Time window
    PERIOD_CHOICES = [
        ('minute', 'Minute'),
        ('hour', 'Hour'),
        ('day', 'Day'),
        ('week', 'Week'),
        ('month', 'Month'),
    ]
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Additional dimensions
    dimensions = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'metric_snapshots'
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['workspace', 'metric_type', '-period_start']),
            models.Index(fields=['metric_type', 'period', '-period_start']),
        ]
        unique_together = ['workspace', 'metric_type', 'period', 'period_start']
    
    def __str__(self):
        return f"{self.metric_type}: {self.value} ({self.period})"


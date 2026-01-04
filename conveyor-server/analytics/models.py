"""
Analytics models for dashboards, reports, and data exploration.
"""

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
import uuid

User = get_user_model()


class Dashboard(models.Model):
    """
    Analytics dashboard configuration.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='dashboards')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=255)
    
    # Layout configuration
    layout = models.JSONField(default=dict, blank=True)  # Grid layout, widget positions
    theme = models.CharField(max_length=50, default='light')
    
    # Settings
    auto_refresh = models.BooleanField(default=False)
    refresh_interval_seconds = models.IntegerField(default=300)  # 5 minutes
    
    # Access control
    is_public = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    
    # Ownership
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_dashboards')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_dashboards')
    
    # Statistics
    view_count = models.IntegerField(default=0)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboards'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['workspace', 'owner']),
            models.Index(fields=['is_public']),
        ]
        unique_together = ['workspace', 'slug']
    
    def __str__(self):
        return self.name


class Widget(models.Model):
    """
    Dashboard widget (chart, table, metric, etc.).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='widgets')
    
    name = models.CharField(max_length=255)
    
    TYPE_CHOICES = [
        ('line_chart', 'Line Chart'),
        ('bar_chart', 'Bar Chart'),
        ('pie_chart', 'Pie Chart'),
        ('area_chart', 'Area Chart'),
        ('scatter_plot', 'Scatter Plot'),
        ('table', 'Table'),
        ('metric', 'Metric'),
        ('text', 'Text'),
        ('map', 'Map'),
        ('heatmap', 'Heatmap'),
        ('gauge', 'Gauge'),
    ]
    widget_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    # Data source
    query_id = models.UUIDField(null=True, blank=True)  # Reference to SavedQuery
    query_text = models.TextField(blank=True)
    data_source = models.JSONField(default=dict, blank=True)
    
    # Visualization config
    config = models.JSONField(default=dict)  # Chart options, colors, axes, etc.
    
    # Position in dashboard grid
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=6)
    height = models.IntegerField(default=4)
    
    # Caching
    cache_duration_seconds = models.IntegerField(default=300)
    last_cached_at = models.DateTimeField(null=True, blank=True)
    cached_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'widgets'
        ordering = ['position_y', 'position_x']
    
    def __str__(self):
        return f"{self.name} ({self.widget_type})"


class SavedQuery(models.Model):
    """
    Saved SQL queries for reuse in analytics.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='saved_queries')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Query
    query_text = models.TextField()
    catalog = models.CharField(max_length=100, default='iceberg')
    schema_name = models.CharField(max_length=100, blank=True)
    
    # Parameters
    parameters = models.JSONField(default=list, blank=True)  # [{name, type, default}]
    
    # Categorization
    tags = models.JSONField(default=list, blank=True)
    folder = models.CharField(max_length=255, blank=True)
    
    # Access control
    is_public = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_queries')
    
    # Statistics
    execution_count = models.IntegerField(default=0)
    last_executed_at = models.DateTimeField(null=True, blank=True)
    avg_execution_time_ms = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'saved_queries'
        verbose_name_plural = 'Saved queries'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['workspace', 'owner']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return self.name


class Report(models.Model):
    """
    Scheduled reports generated from dashboards or queries.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='reports')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Content source
    SOURCE_TYPE_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('query', 'Query'),
        ('custom', 'Custom'),
    ]
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    
    dashboard = models.ForeignKey(Dashboard, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    query = models.ForeignKey(SavedQuery, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    
    # Output format
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('html', 'HTML'),
    ]
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='pdf')
    
    # Schedule
    schedule = models.CharField(max_length=255, blank=True)  # Cron expression
    timezone = models.CharField(max_length=100, default='UTC')
    enabled = models.BooleanField(default=True)
    
    # Delivery
    DELIVERY_CHOICES = [
        ('email', 'Email'),
        ('slack', 'Slack'),
        ('storage', 'Storage'),
    ]
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='email')
    delivery_config = models.JSONField(default=dict)  # Email addresses, channels, etc.
    
    # Status
    last_generated_at = models.DateTimeField(null=True, blank=True)
    last_delivered_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'enabled']),
            models.Index(fields=['next_run_at']),
        ]
    
    def __str__(self):
        return self.name


class ReportExecution(models.Model):
    """
    Report generation execution history.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='executions')
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    
    # Output
    file_url = models.URLField(blank=True)
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    
    # Delivery status
    delivered = models.BooleanField(default=False)
    delivery_error = models.TextField(blank=True, null=True)
    
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'report_executions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.report.name} - {self.status}"


class Exploration(models.Model):
    """
    Ad-hoc data exploration sessions.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='explorations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='explorations')
    
    name = models.CharField(max_length=255, blank=True)
    
    # State
    state = models.JSONField(default=dict)  # Notebook-like state with cells
    
    # Source data
    source_type = models.CharField(max_length=50, blank=True)  # table, file, query
    source_reference = models.CharField(max_length=1024, blank=True)
    
    # Statistics
    cell_count = models.IntegerField(default=0)
    last_cell_executed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'explorations'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['workspace', 'user']),
        ]
    
    def __str__(self):
        return self.name or f"Exploration {self.id}"


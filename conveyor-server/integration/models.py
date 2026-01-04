from django.db import models
from django.utils.translation import gettext_lazy as _
from authentication.models import User, Workspace
import uuid


class SourceCatalog(models.Model):
    """Catalog of available source types with metadata"""

    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20,
        choices=[
            ('api', 'API'),
            ('database', 'Database'),
            ('cloud', 'Cloud Storage'),
            ('file', 'File System'),
        ]
    )
    description = models.TextField()
    auth_types = models.JSONField(default=list)  # List of auth method strings
    documentation = models.URLField(max_length=500)
    popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'source_catalog'
        ordering = ['-popular', 'name']

    def __str__(self):
        return self.name


class Source(models.Model):
    """Data source connection model - represents a connection to a database, API, or other data source"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='sources')
    name = models.CharField(max_length=255)

    TYPE_CHOICES = [
        ('mysql', 'MySQL'),
        ('postgresql', 'PostgreSQL'),
        ('mongodb', 'MongoDB'),
        ('s3', 'Amazon S3'),
        ('kafka', 'Apache Kafka'),
        ('api', 'REST API'),
        ('salesforce', 'Salesforce'),
        ('snowflake', 'Snowflake'),
        ('bigquery', 'Google BigQuery'),
        ('redshift', 'Amazon Redshift'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    # Connection details
    host = models.CharField(max_length=255, blank=True)
    port = models.IntegerField(null=True, blank=True)
    database = models.CharField(max_length=255, blank=True)
    username = models.CharField(max_length=255, blank=True)
    password_encrypted = models.TextField(blank=True)  # Store encrypted
    ssl = models.BooleanField(default=False)

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='inactive')

    last_tested = models.DateTimeField(null=True, blank=True)
    config = models.JSONField(default=dict, blank=True)  # Additional config

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sources')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sources'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.type})"

    @property
    def connector_type(self):
        """Get connector type - maps legacy 'type' field to connector registry names"""
        type_mapping = {
            'mysql': 'mysql',
            'postgresql': 'postgresql',
            'mongodb': 'mongodb',
            'snowflake': 'snowflake',
            'bigquery': 'bigquery',
            'redshift': 'redshift',
            's3': 's3',
            'kafka': 'kafka',
            'salesforce': 'salesforce',
            'api': 'rest_api',
        }
        return type_mapping.get(self.type, self.type)

    def set_password(self, raw_password: str):
        """Encrypt and store password"""
        from integration.utils.encryption import encrypt_password
        self.password_encrypted = encrypt_password(raw_password)

    def get_password(self) -> str:
        """Decrypt and return password"""
        from integration.utils.encryption import decrypt_password
        if self.password_encrypted:
            return decrypt_password(self.password_encrypted)
        return ''


class Pipeline(models.Model):
    """Data integration pipeline"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='pipelines')

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    STATUS_CHOICES = [
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('failed', 'Failed'),
        ('success', 'Success'),
        ('idle', 'Idle'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='idle')

    # Source and destination
    source = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        related_name='source_pipelines'
    )
    destination = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        related_name='destination_pipelines'
    )

    # Scheduling
    schedule = models.CharField(max_length=255, blank=True)  # Cron expression or frequency
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)

    # Statistics
    run_count = models.IntegerField(default=0)
    success_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    records_processed = models.BigIntegerField(default=0)

    # Configuration
    config = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_pipelines')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pipelines'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.name

    @property
    def is_scheduled(self):
        return bool(self.schedule)


class PipelineRun(models.Model):
    """Pipeline execution run record"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='runs')

    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('completed_with_errors', 'Completed with Errors'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)  # milliseconds

    # Metrics
    records_processed = models.BigIntegerField(default=0)
    bytes_processed = models.BigIntegerField(default=0)

    # Errors and logs
    errors = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    error_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)

    # Pipeline execution tracking
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    current_step = models.CharField(max_length=255, blank=True, default='')
    progress = models.IntegerField(default=0)  # 0-100
    state = models.JSONField(default=dict, blank=True)  # For incremental sync bookmarks

    TRIGGER_CHOICES = [
        ('manual', 'Manual'),
        ('schedule', 'Schedule'),
        ('api', 'API'),
    ]
    triggered_by = models.CharField(max_length=50, choices=TRIGGER_CHOICES, default='manual')
    triggered_by_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_pipeline_runs'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pipeline_runs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pipeline', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.pipeline.name} - Run {self.id}"

    @property
    def started_at(self):
        """Alias for start_time"""
        return self.start_time

    @started_at.setter
    def started_at(self, value):
        self.start_time = value

    @property
    def completed_at(self):
        """Alias for end_time"""
        return self.end_time

    @completed_at.setter
    def completed_at(self, value):
        self.end_time = value


class Schedule(models.Model):
    """Pipeline scheduling configuration"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='schedules')
    pipeline = models.OneToOneField(Pipeline, on_delete=models.CASCADE, related_name='schedule_config')

    name = models.CharField(max_length=255)
    cron_expression = models.CharField(max_length=255)  # e.g., "0 0 * * *"
    timezone = models.CharField(max_length=100, default='UTC')

    enabled = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'schedules'
        ordering = ['next_run']
        indexes = [
            models.Index(fields=['workspace', 'enabled']),
            models.Index(fields=['next_run']),
        ]

    def __str__(self):
        return f"{self.name} - {self.cron_expression}"

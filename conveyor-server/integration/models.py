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

    SCHEDULE_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('hourly', 'Every N Hours'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('cron', 'Custom (Cron)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='schedules')
    pipeline = models.OneToOneField(Pipeline, on_delete=models.CASCADE, related_name='schedule_config')

    name = models.CharField(max_length=255)
    
    # User-friendly schedule configuration
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES, default='daily')
    schedule_config = models.JSONField(default=dict, blank=True)  # Stores type-specific config
    
    # Generated cron expression (computed from schedule_type + schedule_config)
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
    
    @staticmethod
    def build_cron_expression(schedule_type: str, config: dict) -> str:
        """
        Convert user-friendly schedule config to cron expression.
        
        Config examples by type:
        - manual: {} (no automatic runs)
        - hourly: {"interval": 2} -> every 2 hours
        - daily: {"hour": 9, "minute": 0} -> daily at 9:00 AM
        - weekly: {"days": [1, 3, 5], "hour": 9, "minute": 0} -> Mon/Wed/Fri at 9:00 AM
        - monthly: {"day": 1, "hour": 9, "minute": 0} -> 1st of month at 9:00 AM
        - cron: {"expression": "0 */2 * * *"} -> raw cron
        """
        if schedule_type == 'manual':
            # Manual trigger only - use a cron that never matches (Feb 30th)
            return '0 0 30 2 *'
        
        elif schedule_type == 'hourly':
            interval = config.get('interval', 1)
            minute = config.get('minute', 0)
            if interval == 1:
                return f'{minute} * * * *'
            return f'{minute} */{interval} * * *'
        
        elif schedule_type == 'daily':
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            return f'{minute} {hour} * * *'
        
        elif schedule_type == 'weekly':
            days = config.get('days', [1])  # Default Monday
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            # Cron uses 0=Sunday, 1=Monday, etc.
            days_str = ','.join(str(d) for d in sorted(days))
            return f'{minute} {hour} * * {days_str}'
        
        elif schedule_type == 'monthly':
            day = config.get('day', 1)
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            return f'{minute} {hour} {day} * *'
        
        elif schedule_type == 'cron':
            return config.get('expression', '0 0 * * *')
        
        # Default daily at midnight
        return '0 0 * * *'
    
    @staticmethod
    def get_schedule_description(schedule_type: str, config: dict, timezone: str = 'UTC') -> str:
        """Generate human-readable schedule description."""
        if schedule_type == 'manual':
            return 'Manual trigger only'
        
        elif schedule_type == 'hourly':
            interval = config.get('interval', 1)
            if interval == 1:
                return 'Every hour'
            return f'Every {interval} hours'
        
        elif schedule_type == 'daily':
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            time_str = f'{hour:02d}:{minute:02d}'
            return f'Daily at {time_str} {timezone}'
        
        elif schedule_type == 'weekly':
            days = config.get('days', [1])
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            days_str = ', '.join(day_names[d] for d in sorted(days))
            time_str = f'{hour:02d}:{minute:02d}'
            return f'Weekly on {days_str} at {time_str} {timezone}'
        
        elif schedule_type == 'monthly':
            day = config.get('day', 1)
            hour = config.get('hour', 0)
            minute = config.get('minute', 0)
            time_str = f'{hour:02d}:{minute:02d}'
            suffix = 'th' if 11 <= day <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
            return f'Monthly on the {day}{suffix} at {time_str} {timezone}'
        
        elif schedule_type == 'cron':
            expression = config.get('expression', '0 0 * * *')
            return f'Custom: {expression}'
        
        return 'Unknown schedule'


class FailedPipelineRecord(models.Model):
    """
    Dead letter queue storage for failed pipeline records.
    
    Stores records that failed processing for later inspection,
    retry, or manual intervention.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record_id = models.CharField(max_length=255, db_index=True)
    pipeline_id = models.UUIDField(db_index=True)
    pipeline_run_id = models.UUIDField(db_index=True)
    
    # Record details
    stream = models.CharField(max_length=255)
    data = models.JSONField(default=dict)
    
    # Error details
    error_message = models.TextField()
    error_type = models.CharField(max_length=255)
    error_traceback = models.TextField(blank=True)
    
    # Retry tracking
    attempt_count = models.IntegerField(default=1)
    max_retries = models.IntegerField(default=3)
    
    STATUS_CHOICES = [
        ('pending', 'Pending Retry'),
        ('retrying', 'Retrying'),
        ('recovered', 'Recovered'),
        ('abandoned', 'Abandoned'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    first_failed_at = models.DateTimeField()
    last_failed_at = models.DateTimeField()
    recovered_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'failed_pipeline_records'
        ordering = ['-last_failed_at']
        indexes = [
            models.Index(fields=['pipeline_id', 'status']),
            models.Index(fields=['pipeline_run_id']),
            models.Index(fields=['status', '-last_failed_at']),
        ]
    
    def __str__(self):
        return f"DLQ: {self.stream} - {self.error_type}"
    
    def can_retry(self) -> bool:
        """Check if this record can be retried"""
        return self.attempt_count < self.max_retries and self.status == 'pending'

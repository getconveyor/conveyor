"""
Data Science models for ML experiments, models, and feature stores.
"""

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
import uuid

User = get_user_model()


class Experiment(models.Model):
    """
    ML experiment tracking.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='experiments')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Configuration
    config = models.JSONField(default=dict)  # Hyperparameters, settings
    
    # Tags and metadata
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Ownership
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_experiments')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'experiments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['owner']),
        ]
    
    def __str__(self):
        return self.name


class ExperimentRun(models.Model):
    """
    Individual run of an ML experiment.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name='runs')
    
    name = models.CharField(max_length=255, blank=True)
    
    # Parameters
    parameters = models.JSONField(default=dict)  # Hyperparameters for this run
    
    # Metrics
    metrics = models.JSONField(default=dict)  # Accuracy, loss, etc.
    
    # Artifacts
    artifacts = models.JSONField(default=list, blank=True)  # Model files, plots, etc.
    
    # Dataset info
    training_data = models.JSONField(default=dict, blank=True)
    validation_data = models.JSONField(default=dict, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    error_message = models.TextField(blank=True, null=True)
    
    # Git info
    git_commit = models.CharField(max_length=40, blank=True)
    git_branch = models.CharField(max_length=255, blank=True)
    
    run_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='experiment_runs')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'experiment_runs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['experiment', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.experiment.name} - Run {self.id}"


class MLModel(models.Model):
    """
    Registered ML model.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='ml_models')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Model type
    FRAMEWORK_CHOICES = [
        ('sklearn', 'Scikit-learn'),
        ('tensorflow', 'TensorFlow'),
        ('pytorch', 'PyTorch'),
        ('xgboost', 'XGBoost'),
        ('lightgbm', 'LightGBM'),
        ('custom', 'Custom'),
    ]
    framework = models.CharField(max_length=50, choices=FRAMEWORK_CHOICES)
    
    model_type = models.CharField(max_length=100, blank=True)  # classifier, regressor, etc.
    
    # Latest version
    latest_version = models.IntegerField(default=0)
    
    # Tags
    tags = models.JSONField(default=list, blank=True)
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_models')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ml_models'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'framework']),
        ]
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name


class ModelVersion(models.Model):
    """
    Version of an ML model.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='versions')
    
    version = models.IntegerField()
    
    # Source
    experiment_run = models.ForeignKey(
        ExperimentRun, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='model_versions'
    )
    
    # Artifacts
    artifact_path = models.CharField(max_length=1024)  # S3/MinIO path
    artifact_size_bytes = models.BigIntegerField(null=True, blank=True)
    
    # Schema
    input_schema = models.JSONField(default=dict, blank=True)
    output_schema = models.JSONField(default=dict, blank=True)
    
    # Metrics
    metrics = models.JSONField(default=dict)
    
    # Stage
    STAGE_CHOICES = [
        ('none', 'None'),
        ('staging', 'Staging'),
        ('production', 'Production'),
        ('archived', 'Archived'),
    ]
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='none')
    
    # Description
    description = models.TextField(blank=True)
    
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='registered_model_versions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'model_versions'
        ordering = ['-version']
        indexes = [
            models.Index(fields=['model', '-version']),
            models.Index(fields=['stage']),
        ]
        unique_together = ['model', 'version']
    
    def __str__(self):
        return f"{self.model.name} v{self.version}"


class FeatureGroup(models.Model):
    """
    Feature group for feature store.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='feature_groups')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Entity
    entity_name = models.CharField(max_length=255)  # e.g., 'customer', 'product'
    entity_key = models.CharField(max_length=255)  # e.g., 'customer_id'
    
    # Source
    source_table = models.CharField(max_length=1024, blank=True)
    transformation_query = models.TextField(blank=True)
    
    # Schema
    features = models.JSONField(default=list)  # [{name, type, description}]
    
    # Settings
    online_enabled = models.BooleanField(default=False)
    ttl_days = models.IntegerField(null=True, blank=True)
    
    # Statistics
    row_count = models.BigIntegerField(null=True, blank=True)
    last_updated_at = models.DateTimeField(null=True, blank=True)
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_feature_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feature_groups'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'entity_name']),
        ]
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name


class FeatureView(models.Model):
    """
    Feature view combining multiple feature groups.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='feature_views')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Feature groups
    feature_groups = models.ManyToManyField(FeatureGroup, related_name='feature_views')
    
    # Selected features
    features = models.JSONField(default=list)  # [{group_name, feature_name}]
    
    # Entity join keys
    join_keys = models.JSONField(default=list)
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_feature_views')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feature_views'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace']),
        ]
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name


class TrainingDataset(models.Model):
    """
    Training dataset created from feature view.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='training_datasets')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Source
    feature_view = models.ForeignKey(FeatureView, on_delete=models.SET_NULL, null=True, related_name='training_datasets')
    
    # Time range
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Storage
    storage_path = models.CharField(max_length=1024)
    format = models.CharField(max_length=20, default='parquet')
    
    # Statistics
    row_count = models.BigIntegerField(null=True, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    
    # Splits
    splits = models.JSONField(default=dict, blank=True)  # {train: 0.7, val: 0.2, test: 0.1}
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_training_datasets')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'training_datasets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace']),
            models.Index(fields=['feature_view']),
        ]
    
    def __str__(self):
        return self.name


class FeatureDefinition(models.Model):
    """
    Individual feature definition within a feature group.
    Defines the transformation logic and metadata for a single feature.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature_group = models.ForeignKey(FeatureGroup, on_delete=models.CASCADE, related_name='feature_definitions')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Data type
    DTYPE_CHOICES = [
        ('int', 'Integer'),
        ('float', 'Float'),
        ('string', 'String'),
        ('bool', 'Boolean'),
        ('datetime', 'DateTime'),
        ('array', 'Array'),
        ('embedding', 'Embedding'),
    ]
    dtype = models.CharField(max_length=50, choices=DTYPE_CHOICES)
    
    # Transformation
    TRANSFORM_TYPE_CHOICES = [
        ('passthrough', 'Passthrough'),
        ('standard_scale', 'Standard Scaling'),
        ('min_max_scale', 'Min-Max Scaling'),
        ('log_transform', 'Log Transform'),
        ('one_hot', 'One-Hot Encoding'),
        ('label_encode', 'Label Encoding'),
        ('embedding', 'Embedding'),
        ('bucketize', 'Bucketize'),
        ('time_since', 'Time Since'),
        ('date_parts', 'Date Parts'),
        ('rolling_agg', 'Rolling Aggregation'),
        ('custom_sql', 'Custom SQL'),
        ('custom_python', 'Custom Python'),
    ]
    transform_type = models.CharField(max_length=50, choices=TRANSFORM_TYPE_CHOICES, default='passthrough')
    transform_config = models.JSONField(default=dict, blank=True)  # Transform parameters
    
    # Source columns used to compute this feature
    source_columns = models.JSONField(default=list)
    
    # Custom transformation expression
    transformation_expression = models.TextField(blank=True)  # SQL or Python expression
    
    # Statistics (computed during materialization)
    statistics = models.JSONField(default=dict, blank=True)  # min, max, mean, std, nulls, etc.
    
    # Feature importance (if computed)
    importance_score = models.FloatField(null=True, blank=True)
    
    # Validation rules
    validation_rules = models.JSONField(default=list, blank=True)  # [{rule_type, params}]
    
    # Order in feature group
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feature_definitions'
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['feature_group', 'is_active']),
        ]
        unique_together = ['feature_group', 'name']
    
    def __str__(self):
        return f"{self.feature_group.name}.{self.name}"


class FeatureEngineeringJob(models.Model):
    """
    Feature engineering job that transforms raw data into features.
    Manages the pipeline from data lake to feature store.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='feature_engineering_jobs')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Source configuration
    source_type = models.CharField(max_length=50, default='data_lake')  # data_lake, database, api
    source_table = models.CharField(max_length=1024)  # Data lake table or query source
    source_query = models.TextField(blank=True)  # Optional custom source query
    
    # Target
    target_feature_group = models.ForeignKey(
        FeatureGroup, 
        on_delete=models.CASCADE, 
        related_name='engineering_jobs'
    )
    
    # Transformation logic
    TRANSFORM_MODE_CHOICES = [
        ('sql', 'SQL'),
        ('python', 'Python'),
        ('hybrid', 'Hybrid'),
    ]
    transform_mode = models.CharField(max_length=20, choices=TRANSFORM_MODE_CHOICES, default='sql')
    sql_query = models.TextField(blank=True)  # SQL transformation
    python_code = models.TextField(blank=True)  # Python/Pandas code
    
    # Data preparation steps
    data_prep_config = models.JSONField(default=dict, blank=True)
    # {
    #   "handle_nulls": {"strategy": "fill", "fill_value": 0},
    #   "handle_outliers": {"method": "clip", "lower": 0.01, "upper": 0.99},
    #   "deduplicate": {"columns": ["id"], "keep": "last"},
    #   "filter_conditions": [{"column": "status", "op": "eq", "value": "active"}]
    # }
    
    # Feature engineering steps (ordered list)
    feature_engineering_steps = models.JSONField(default=list, blank=True)
    # [
    #   {"name": "age_scaled", "type": "standard_scale", "source": "age"},
    #   {"name": "category_encoded", "type": "one_hot", "source": "category"},
    #   {"name": "days_since_signup", "type": "time_since", "source": "signup_date"},
    # ]
    
    # Scheduling
    SCHEDULE_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('cron', 'Cron Schedule'),
        ('interval', 'Interval'),
        ('event', 'Event Triggered'),
    ]
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES, default='manual')
    schedule_cron = models.CharField(max_length=100, blank=True)  # e.g., "0 2 * * *"
    schedule_interval_minutes = models.IntegerField(null=True, blank=True)
    
    # Incremental processing
    is_incremental = models.BooleanField(default=False)
    watermark_column = models.CharField(max_length=255, blank=True)  # Column for incremental
    last_watermark = models.JSONField(null=True, blank=True)  # Last processed value
    
    # Backfill configuration
    backfill_start_date = models.DateTimeField(null=True, blank=True)
    backfill_end_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('error', 'Error'),
        ('draft', 'Draft'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Execution stats
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_run_status = models.CharField(max_length=20, blank=True)
    last_run_duration_seconds = models.IntegerField(null=True, blank=True)
    last_run_rows_processed = models.BigIntegerField(null=True, blank=True)
    total_runs = models.IntegerField(default=0)
    successful_runs = models.IntegerField(default=0)
    failed_runs = models.IntegerField(default=0)
    
    # Error tracking
    last_error_message = models.TextField(blank=True)
    last_error_at = models.DateTimeField(null=True, blank=True)
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_fe_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feature_engineering_jobs'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['target_feature_group']),
            models.Index(fields=['schedule_type']),
        ]
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name


class FeatureEngineeringRun(models.Model):
    """
    Individual run of a feature engineering job.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(FeatureEngineeringJob, on_delete=models.CASCADE, related_name='runs')
    
    # Execution details
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    # Progress tracking
    current_step = models.CharField(max_length=255, blank=True)
    progress_percent = models.IntegerField(default=0)
    
    # Metrics
    rows_read = models.BigIntegerField(default=0)
    rows_processed = models.BigIntegerField(default=0)
    rows_written = models.BigIntegerField(default=0)
    rows_failed = models.BigIntegerField(default=0)
    
    # Data range processed
    data_start_time = models.DateTimeField(null=True, blank=True)
    data_end_time = models.DateTimeField(null=True, blank=True)
    watermark_value = models.JSONField(null=True, blank=True)
    
    # Error info
    error_message = models.TextField(blank=True)
    error_traceback = models.TextField(blank=True)
    
    # Logs
    logs = models.TextField(blank=True)
    
    # Celery task ID
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='triggered_fe_runs')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'feature_engineering_runs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['job', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.job.name} - Run {self.id}"


class FeatureMaterialization(models.Model):
    """
    Record of feature materialization to offline/online stores.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature_group = models.ForeignKey(FeatureGroup, on_delete=models.CASCADE, related_name='materializations')
    
    # Source run (if from FE job)
    engineering_run = models.ForeignKey(
        FeatureEngineeringRun, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='materializations'
    )
    
    # Materialization type
    STORE_TYPE_CHOICES = [
        ('offline', 'Offline Store'),
        ('online', 'Online Store'),
        ('both', 'Both Stores'),
    ]
    store_type = models.CharField(max_length=20, choices=STORE_TYPE_CHOICES, default='offline')
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Data range
    data_start_time = models.DateTimeField(null=True, blank=True)
    data_end_time = models.DateTimeField(null=True, blank=True)
    
    # Metrics
    rows_materialized = models.BigIntegerField(default=0)
    features_materialized = models.IntegerField(default=0)
    storage_bytes = models.BigIntegerField(null=True, blank=True)
    
    # Offline store details
    offline_path = models.CharField(max_length=1024, blank=True)
    offline_format = models.CharField(max_length=20, default='parquet')
    
    # Online store details
    online_keys_updated = models.BigIntegerField(default=0)
    online_ttl_seconds = models.IntegerField(null=True, blank=True)
    
    # Error info
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'feature_materializations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['feature_group', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.feature_group.name} - {self.created_at}"


class OnlineFeatureStore(models.Model):
    """
    Online feature store configuration for low-latency serving.
    Backed by Redis or similar key-value store.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='online_feature_stores')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Redis configuration
    redis_host = models.CharField(max_length=255, default='redis')
    redis_port = models.IntegerField(default=6379)
    redis_db = models.IntegerField(default=0)
    redis_key_prefix = models.CharField(max_length=255, default='features')
    
    # TTL settings
    default_ttl_seconds = models.IntegerField(default=86400)  # 24 hours
    
    # Status
    is_active = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    # Metrics
    total_keys = models.BigIntegerField(default=0)
    memory_used_bytes = models.BigIntegerField(null=True, blank=True)
    avg_latency_ms = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'online_feature_stores'
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name

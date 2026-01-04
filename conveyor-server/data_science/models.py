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


"""
Data Governance models for data lineage, quality rules, and compliance.
"""

from django.db import models
from django.contrib.auth import get_user_model
from authentication.models import Workspace
import uuid

User = get_user_model()


class DataAsset(models.Model):
    """
    Represents a data asset in the platform (table, file, view, etc.).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='data_assets')
    
    name = models.CharField(max_length=255)
    qualified_name = models.CharField(max_length=1024, unique=True)  # catalog.schema.table
    description = models.TextField(blank=True)
    
    TYPE_CHOICES = [
        ('table', 'Table'),
        ('view', 'View'),
        ('file', 'File'),
        ('stream', 'Stream'),
        ('dashboard', 'Dashboard'),
        ('report', 'Report'),
    ]
    asset_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    # Location
    catalog = models.CharField(max_length=255, blank=True)
    schema_name = models.CharField(max_length=255, blank=True)
    
    # Metadata
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_assets')
    tags = models.JSONField(default=list, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    
    # Statistics
    row_count = models.BigIntegerField(null=True, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    column_count = models.IntegerField(null=True, blank=True)
    
    # Classification
    SENSITIVITY_CHOICES = [
        ('public', 'Public'),
        ('internal', 'Internal'),
        ('confidential', 'Confidential'),
        ('restricted', 'Restricted'),
    ]
    sensitivity = models.CharField(max_length=20, choices=SENSITIVITY_CHOICES, default='internal')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'data_assets'
        ordering = ['qualified_name']
        indexes = [
            models.Index(fields=['workspace', 'asset_type']),
            models.Index(fields=['qualified_name']),
            models.Index(fields=['owner']),
        ]
    
    def __str__(self):
        return self.qualified_name


class DataLineage(models.Model):
    """
    Tracks data lineage - relationships between data assets.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='lineage_edges')
    
    # Source and target assets
    source_asset = models.ForeignKey(
        DataAsset, 
        on_delete=models.CASCADE, 
        related_name='downstream_lineage'
    )
    target_asset = models.ForeignKey(
        DataAsset, 
        on_delete=models.CASCADE, 
        related_name='upstream_lineage'
    )
    
    # Lineage type
    TYPE_CHOICES = [
        ('direct', 'Direct'),
        ('transform', 'Transform'),
        ('aggregate', 'Aggregate'),
        ('filter', 'Filter'),
        ('join', 'Join'),
        ('derive', 'Derive'),
    ]
    lineage_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='direct')
    
    # Pipeline that created this lineage
    pipeline_id = models.UUIDField(null=True, blank=True)
    pipeline_run_id = models.UUIDField(null=True, blank=True)
    
    # Transformation details
    transformation = models.JSONField(default=dict, blank=True)  # SQL, column mappings, etc.
    
    # Column-level lineage
    column_mappings = models.JSONField(default=list, blank=True)  # [{source_col, target_col, transform}]
    
    # Confidence score (for inferred lineage)
    confidence = models.FloatField(default=1.0)  # 0-1
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_lineage'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source_asset']),
            models.Index(fields=['target_asset']),
            models.Index(fields=['pipeline_id']),
        ]
        unique_together = ['source_asset', 'target_asset', 'lineage_type']
    
    def __str__(self):
        return f"{self.source_asset.name} → {self.target_asset.name}"


class DataQualityRule(models.Model):
    """
    Data quality rules for validation and monitoring.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='quality_rules')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Target
    data_asset = models.ForeignKey(
        DataAsset, 
        on_delete=models.CASCADE, 
        related_name='quality_rules'
    )
    column_name = models.CharField(max_length=255, blank=True)  # Empty for table-level rules
    
    # Rule type
    RULE_TYPE_CHOICES = [
        ('not_null', 'Not Null'),
        ('unique', 'Unique'),
        ('range', 'Range Check'),
        ('regex', 'Regex Pattern'),
        ('enum', 'Enumeration'),
        ('referential', 'Referential Integrity'),
        ('custom_sql', 'Custom SQL'),
        ('freshness', 'Freshness'),
        ('volume', 'Volume Check'),
    ]
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    
    # Rule configuration
    config = models.JSONField(default=dict)  # Rule-specific parameters
    
    # Severity and thresholds
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='warning')
    
    # Pass threshold (percentage of rows that must pass)
    threshold = models.FloatField(default=100.0)  # 0-100
    
    # Status
    enabled = models.BooleanField(default=True)
    
    # Schedule
    schedule = models.CharField(max_length=255, blank=True)  # Cron expression
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quality_rules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_quality_rules'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'enabled']),
            models.Index(fields=['data_asset']),
            models.Index(fields=['rule_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.rule_type})"


class DataQualityResult(models.Model):
    """
    Results from data quality rule executions.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rule = models.ForeignKey(DataQualityRule, on_delete=models.CASCADE, related_name='results')
    
    # Execution details
    executed_at = models.DateTimeField()
    duration_ms = models.IntegerField(null=True, blank=True)
    
    # Results
    STATUS_CHOICES = [
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    total_rows = models.BigIntegerField(null=True, blank=True)
    passed_rows = models.BigIntegerField(null=True, blank=True)
    failed_rows = models.BigIntegerField(null=True, blank=True)
    pass_rate = models.FloatField(null=True, blank=True)  # 0-100
    
    # Failure details
    failure_samples = models.JSONField(default=list, blank=True)  # Sample of failed rows
    error_message = models.TextField(blank=True, null=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'governance_quality_results'
        ordering = ['-executed_at']
        indexes = [
            models.Index(fields=['rule', '-executed_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.rule.name}: {self.status} ({self.pass_rate}%)"


class GlossaryTerm(models.Model):
    """
    Business glossary terms for data documentation.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='glossary_terms')
    
    name = models.CharField(max_length=255)
    definition = models.TextField()
    
    # Categories
    category = models.CharField(max_length=100, blank=True)
    subcategory = models.CharField(max_length=100, blank=True)
    
    # Relationships
    related_terms = models.ManyToManyField('self', blank=True, symmetrical=True)
    synonyms = models.JSONField(default=list, blank=True)
    
    # Ownership
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_terms')
    steward = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='steward_terms')
    
    # Status
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('approved', 'Approved'),
        ('deprecated', 'Deprecated'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'glossary_terms'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['category']),
        ]
        unique_together = ['workspace', 'name']
    
    def __str__(self):
        return self.name


class Policy(models.Model):
    """
    Data policies for access control and compliance.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='policies')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    TYPE_CHOICES = [
        ('access', 'Access Control'),
        ('retention', 'Data Retention'),
        ('masking', 'Data Masking'),
        ('encryption', 'Encryption'),
        ('audit', 'Audit'),
    ]
    policy_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Policy rules
    rules = models.JSONField(default=list)  # List of rule definitions
    
    # Scope
    applies_to = models.ManyToManyField(DataAsset, related_name='policies', blank=True)
    applies_to_tags = models.JSONField(default=list, blank=True)  # Tag-based scope
    
    # Status
    enabled = models.BooleanField(default=True)
    
    # Compliance
    compliance_frameworks = models.JSONField(default=list, blank=True)  # e.g., ['GDPR', 'HIPAA']
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_policies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'policies'
        verbose_name_plural = 'Policies'
        ordering = ['name']
        indexes = [
            models.Index(fields=['workspace', 'enabled']),
            models.Index(fields=['policy_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.policy_type})"


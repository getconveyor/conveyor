from django.db import models
from django.utils.translation import gettext_lazy as _
from authentication.models import User, Workspace
from integration.models import Pipeline
import uuid


class Transformation(models.Model):
    """Data transformation configuration"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='transformations')
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='transformations', null=True, blank=True)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    TYPE_CHOICES = [
        ('filter', 'Filter'),
        ('map', 'Map'),
        ('aggregate', 'Aggregate'),
        ('join', 'Join'),
        ('pivot', 'Pivot'),
        ('unpivot', 'Unpivot'),
        ('custom', 'Custom'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    # Transformation configuration
    config = models.JSONField(default=dict)  # Stores transformation logic
    input_schema = models.JSONField(default=dict, blank=True)
    output_schema = models.JSONField(default=dict, blank=True)

    # Execution
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    order = models.IntegerField(default=0)  # Execution order

    # Statistics
    last_run = models.DateTimeField(null=True, blank=True)
    records_processed = models.BigIntegerField(default=0)
    avg_execution_time = models.IntegerField(default=0)  # milliseconds

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_transformations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transformations'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['pipeline']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return self.name


class TransformationRule(models.Model):
    """Individual transformation rule within a transformation"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transformation = models.ForeignKey(Transformation, on_delete=models.CASCADE, related_name='rules')

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    RULE_TYPE_CHOICES = [
        ('rename', 'Rename Column'),
        ('cast', 'Cast Type'),
        ('calculate', 'Calculate Field'),
        ('filter', 'Filter Rows'),
        ('replace', 'Replace Values'),
        ('split', 'Split Column'),
        ('merge', 'Merge Columns'),
        ('custom', 'Custom Expression'),
    ]
    rule_type = models.CharField(max_length=50, choices=RULE_TYPE_CHOICES)

    # Rule configuration
    config = models.JSONField(default=dict)  # Stores rule-specific settings
    enabled = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transformation_rules'
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['transformation', 'enabled']),
        ]

    def __str__(self):
        return f"{self.transformation.name} - {self.name}"


class DataQualityCheck(models.Model):
    """Data quality validation rule"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='quality_checks')
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='quality_checks', null=True, blank=True)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    CHECK_TYPE_CHOICES = [
        ('completeness', 'Completeness'),  # Check for null values
        ('uniqueness', 'Uniqueness'),  # Check for duplicates
        ('validity', 'Validity'),  # Check data format/type
        ('consistency', 'Consistency'),  # Check cross-field rules
        ('accuracy', 'Accuracy'),  # Check against reference data
        ('custom', 'Custom SQL'),
    ]
    check_type = models.CharField(max_length=50, choices=CHECK_TYPE_CHOICES)

    # Check configuration
    target_table = models.CharField(max_length=255, blank=True)
    target_column = models.CharField(max_length=255, blank=True)
    rule = models.TextField()  # SQL expression or validation rule
    threshold = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)  # Pass percentage

    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info'),
    ]
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default='warning')

    enabled = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    last_result = models.CharField(max_length=50, blank=True)  # passed/failed

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quality_checks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'data_quality_checks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'enabled']),
            models.Index(fields=['pipeline']),
            models.Index(fields=['check_type']),
        ]

    def __str__(self):
        return self.name


class DataQualityResult(models.Model):
    """Result from a data quality check execution"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quality_check = models.ForeignKey(DataQualityCheck, on_delete=models.CASCADE, related_name='results')

    RESULT_CHOICES = [
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('error', 'Error'),
    ]
    result = models.CharField(max_length=50, choices=RESULT_CHOICES)

    # Metrics
    total_records = models.BigIntegerField(default=0)
    passed_records = models.BigIntegerField(default=0)
    failed_records = models.BigIntegerField(default=0)
    pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Details
    execution_time = models.IntegerField(default=0)  # milliseconds
    error_message = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)  # Additional result data

    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'data_quality_results'
        ordering = ['-executed_at']
        indexes = [
            models.Index(fields=['quality_check', '-executed_at']),
            models.Index(fields=['result']),
        ]

    def __str__(self):
        return f"{self.quality_check.name} - {self.result} ({self.executed_at})"

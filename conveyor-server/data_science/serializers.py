"""
Serializers for data science - ML experiments, models, and feature store.
"""

from rest_framework import serializers
from .models import (
    Experiment,
    ExperimentRun,
    MLModel,
    ModelVersion,
    FeatureGroup,
    FeatureView,
    TrainingDataset,
    FeatureDefinition,
    FeatureEngineeringJob,
    FeatureEngineeringRun,
    FeatureMaterialization,
    OnlineFeatureStore,
)


class ExperimentSerializer(serializers.ModelSerializer):
    """Serializer for ML experiments."""
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    run_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Experiment
        fields = [
            'id', 'workspace', 'name', 'description',
            'tags', 'status', 'created_by', 'created_by_name',
            'run_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_run_count(self, obj):
        return obj.runs.count()


class ExperimentRunSerializer(serializers.ModelSerializer):
    """Serializer for experiment runs."""
    experiment_name = serializers.CharField(source='experiment.name', read_only=True)
    
    class Meta:
        model = ExperimentRun
        fields = [
            'id', 'experiment', 'experiment_name',
            'name', 'status', 'parameters', 'metrics',
            'artifacts', 'start_time', 'end_time',
            'error_message', 'created_at',
        ]
        read_only_fields = ['created_at', 'start_time', 'end_time']


class MLModelSerializer(serializers.ModelSerializer):
    """Serializer for ML models."""
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    version_count = serializers.SerializerMethodField()
    latest_version = serializers.SerializerMethodField()
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'workspace', 'name', 'description',
            'model_type', 'framework', 'tags',
            'created_by', 'created_by_name',
            'version_count', 'latest_version',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_version_count(self, obj):
        return obj.versions.count()
    
    def get_latest_version(self, obj):
        latest = obj.versions.order_by('-version_number').first()
        if latest:
            return {
                'version_number': latest.version_number,
                'stage': latest.stage,
            }
        return None


class ModelVersionSerializer(serializers.ModelSerializer):
    """Serializer for model versions."""
    model_name = serializers.CharField(source='model.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = ModelVersion
        fields = [
            'id', 'model', 'model_name', 'version_number',
            'description', 'artifact_path', 'metrics',
            'parameters', 'stage', 'run',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'version_number']
    
    def create(self, validated_data):
        model = validated_data.get('model')
        # Auto-increment version number
        latest = ModelVersion.objects.filter(model=model).order_by('-version_number').first()
        validated_data['version_number'] = (latest.version_number + 1) if latest else 1
        return super().create(validated_data)


class FeatureGroupSerializer(serializers.ModelSerializer):
    """Serializer for feature groups."""
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    feature_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureGroup
        fields = [
            'id', 'workspace', 'name', 'description',
            'entity_type', 'features', 'feature_count',
            'online_enabled', 'offline_enabled',
            'source_table', 'primary_key', 'event_time_column',
            'ttl_minutes', 'tags',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_feature_count(self, obj):
        features = obj.features or []
        return len(features)


class FeatureViewSerializer(serializers.ModelSerializer):
    """Serializer for feature views."""
    feature_group_name = serializers.CharField(source='feature_group.name', read_only=True)
    
    class Meta:
        model = FeatureView
        fields = [
            'id', 'workspace', 'name', 'description',
            'feature_group', 'feature_group_name',
            'features', 'query',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TrainingDatasetSerializer(serializers.ModelSerializer):
    """Serializer for training datasets."""
    feature_view_name = serializers.CharField(source='feature_view.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = TrainingDataset
        fields = [
            'id', 'workspace', 'name', 'description',
            'feature_view', 'feature_view_name',
            'version', 'query', 'storage_path',
            'format', 'statistics',
            'created_by', 'created_by_name',
            'created_at',
        ]
        read_only_fields = ['created_at']


class ExperimentSummarySerializer(serializers.Serializer):
    """Serializer for experiment summary."""
    total_experiments = serializers.IntegerField()
    active_experiments = serializers.IntegerField()
    total_runs = serializers.IntegerField()
    successful_runs = serializers.IntegerField()
    failed_runs = serializers.IntegerField()


class ModelRegistrySummarySerializer(serializers.Serializer):
    """Serializer for model registry summary."""
    total_models = serializers.IntegerField()
    total_versions = serializers.IntegerField()
    production_models = serializers.IntegerField()
    staging_models = serializers.IntegerField()
    models_by_framework = serializers.DictField()


class FeatureStoreSummarySerializer(serializers.Serializer):
    """Serializer for feature store summary."""
    total_feature_groups = serializers.IntegerField()
    total_features = serializers.IntegerField()
    total_feature_views = serializers.IntegerField()
    total_training_datasets = serializers.IntegerField()
    online_enabled_groups = serializers.IntegerField()

# New Feature Store Serializers

class FeatureDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for individual feature definitions."""
    feature_group_name = serializers.CharField(source='feature_group.name', read_only=True)
    
    class Meta:
        model = FeatureDefinition
        fields = [
            'id', 'feature_group', 'feature_group_name',
            'name', 'description', 'dtype',
            'transform_type', 'transform_config',
            'source_columns', 'transformation_expression',
            'statistics', 'importance_score',
            'validation_rules', 'order', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'statistics']


class FeatureDefinitionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating feature definitions."""
    
    class Meta:
        model = FeatureDefinition
        fields = [
            'feature_group', 'name', 'description', 'dtype',
            'transform_type', 'transform_config',
            'source_columns', 'transformation_expression',
            'validation_rules', 'order', 'is_active',
        ]


class FeatureEngineeringJobSerializer(serializers.ModelSerializer):
    """Serializer for feature engineering jobs."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    target_feature_group_name = serializers.CharField(source='target_feature_group.name', read_only=True)
    run_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureEngineeringJob
        fields = [
            'id', 'workspace', 'name', 'description',
            'source_type', 'source_table', 'source_query',
            'target_feature_group', 'target_feature_group_name',
            'transform_mode', 'sql_query', 'python_code',
            'data_prep_config', 'feature_engineering_steps',
            'schedule_type', 'schedule_cron', 'schedule_interval_minutes',
            'is_incremental', 'watermark_column', 'last_watermark',
            'backfill_start_date', 'backfill_end_date',
            'status', 'last_run_at', 'last_run_status',
            'last_run_duration_seconds', 'last_run_rows_processed',
            'total_runs', 'successful_runs', 'failed_runs',
            'last_error_message', 'last_error_at',
            'owner', 'owner_name', 'run_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'last_run_at', 'last_run_status',
            'last_run_duration_seconds', 'last_run_rows_processed',
            'total_runs', 'successful_runs', 'failed_runs',
            'last_error_message', 'last_error_at', 'last_watermark',
        ]
    
    def get_run_count(self, obj):
        return obj.runs.count()


class FeatureEngineeringJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating feature engineering jobs."""
    
    class Meta:
        model = FeatureEngineeringJob
        fields = [
            'name', 'description',
            'source_type', 'source_table', 'source_query',
            'target_feature_group',
            'transform_mode', 'sql_query', 'python_code',
            'data_prep_config', 'feature_engineering_steps',
            'schedule_type', 'schedule_cron', 'schedule_interval_minutes',
            'is_incremental', 'watermark_column',
            'backfill_start_date', 'backfill_end_date',
        ]


class FeatureEngineeringRunSerializer(serializers.ModelSerializer):
    """Serializer for feature engineering runs."""
    job_name = serializers.CharField(source='job.name', read_only=True)
    triggered_by_name = serializers.CharField(source='triggered_by.email', read_only=True)
    
    class Meta:
        model = FeatureEngineeringRun
        fields = [
            'id', 'job', 'job_name', 'status',
            'started_at', 'completed_at', 'duration_seconds',
            'current_step', 'progress_percent',
            'rows_read', 'rows_processed', 'rows_written', 'rows_failed',
            'data_start_time', 'data_end_time', 'watermark_value',
            'error_message', 'error_traceback', 'logs',
            'celery_task_id', 'triggered_by', 'triggered_by_name',
            'created_at',
        ]
        read_only_fields = ['created_at']


class FeatureMaterializationSerializer(serializers.ModelSerializer):
    """Serializer for feature materializations."""
    feature_group_name = serializers.CharField(source='feature_group.name', read_only=True)
    
    class Meta:
        model = FeatureMaterialization
        fields = [
            'id', 'feature_group', 'feature_group_name',
            'engineering_run', 'store_type', 'status',
            'started_at', 'completed_at',
            'data_start_time', 'data_end_time',
            'rows_materialized', 'features_materialized', 'storage_bytes',
            'offline_path', 'offline_format',
            'online_keys_updated', 'online_ttl_seconds',
            'error_message', 'created_at',
        ]
        read_only_fields = ['created_at']


class OnlineFeatureStoreSerializer(serializers.ModelSerializer):
    """Serializer for online feature store configuration."""
    
    class Meta:
        model = OnlineFeatureStore
        fields = [
            'id', 'workspace', 'name', 'description',
            'redis_host', 'redis_port', 'redis_db', 'redis_key_prefix',
            'default_ttl_seconds', 'is_active', 'last_sync_at',
            'total_keys', 'memory_used_bytes', 'avg_latency_ms',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_sync_at', 'total_keys', 'memory_used_bytes', 'avg_latency_ms']


class FeatureStatisticsSerializer(serializers.Serializer):
    """Serializer for feature statistics."""
    feature_name = serializers.CharField()
    dtype = serializers.CharField()
    count = serializers.IntegerField()
    non_null_count = serializers.IntegerField()
    null_count = serializers.IntegerField()
    null_percentage = serializers.FloatField()
    
    # Numeric stats (optional)
    min = serializers.FloatField(required=False)
    max = serializers.FloatField(required=False)
    mean = serializers.FloatField(required=False)
    median = serializers.FloatField(required=False)
    std = serializers.FloatField(required=False)
    
    # Categorical stats (optional)
    unique_count = serializers.IntegerField(required=False)
    most_common = serializers.ListField(required=False)
    
    # Histogram (optional)
    histogram = serializers.DictField(required=False)


class GetFeaturesRequestSerializer(serializers.Serializer):
    """Serializer for get features request."""
    entity_ids = serializers.ListField(child=serializers.CharField())
    features = serializers.ListField(child=serializers.CharField(), required=False)


class GetFeaturesResponseSerializer(serializers.Serializer):
    """Serializer for get features response."""
    entity_id = serializers.CharField()
    features = serializers.DictField()


class CreateTrainingDatasetRequestSerializer(serializers.Serializer):
    """Serializer for create training dataset request."""
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    label_column = serializers.CharField(required=False, allow_null=True)
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    end_time = serializers.DateTimeField(required=False, allow_null=True)
    split_config = serializers.DictField(required=False)


class MaterializeFeaturesRequestSerializer(serializers.Serializer):
    """Serializer for materialize features request."""
    store_type = serializers.ChoiceField(choices=['offline', 'online', 'both'], default='offline')
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    end_time = serializers.DateTimeField(required=False, allow_null=True)


class RunFeatureEngineeringRequestSerializer(serializers.Serializer):
    """Serializer for run feature engineering request."""
    async_execution = serializers.BooleanField(default=True)
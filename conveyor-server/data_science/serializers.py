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

from rest_framework import serializers
from .models import Transformation, TransformationRule, DataQualityCheck, DataQualityResult, Notebook
from authentication.serializers import UserSerializer
from integration.serializers import PipelineListSerializer


class TransformationRuleSerializer(serializers.ModelSerializer):
    """Serializer for TransformationRule model"""

    class Meta:
        model = TransformationRule
        fields = [
            'id', 'transformation', 'name', 'description', 'rule_type',
            'config', 'enabled', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransformationSerializer(serializers.ModelSerializer):
    """Serializer for Transformation model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    pipeline_details = PipelineListSerializer(source='pipeline', read_only=True)
    rules = TransformationRuleSerializer(many=True, read_only=True)
    rules_count = serializers.SerializerMethodField()

    class Meta:
        model = Transformation
        fields = [
            'id', 'workspace', 'pipeline', 'pipeline_details', 'name',
            'description', 'type', 'config', 'input_schema', 'output_schema',
            'status', 'order', 'last_run', 'records_processed',
            'avg_execution_time', 'created_by', 'created_by_details',
            'created_at', 'updated_at', 'rules', 'rules_count'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_details',
            'pipeline_details', 'rules', 'rules_count', 'last_run',
            'records_processed', 'avg_execution_time'
        ]

    def get_rules_count(self, obj):
        return obj.rules.count()


class TransformationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing transformations"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    rules_count = serializers.SerializerMethodField()

    class Meta:
        model = Transformation
        fields = [
            'id', 'name', 'type', 'pipeline_name', 'status', 'order',
            'last_run', 'records_processed', 'rules_count', 'created_at'
        ]
        read_only_fields = fields

    def get_rules_count(self, obj):
        return obj.rules.count()


class DataQualityCheckSerializer(serializers.ModelSerializer):
    """Serializer for DataQualityCheck model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    pipeline_details = PipelineListSerializer(source='pipeline', read_only=True)
    recent_results = serializers.SerializerMethodField()

    class Meta:
        model = DataQualityCheck
        fields = [
            'id', 'workspace', 'pipeline', 'pipeline_details', 'name',
            'description', 'check_type', 'target_table', 'target_column',
            'rule', 'threshold', 'severity', 'enabled', 'last_run',
            'last_result', 'created_by', 'created_by_details', 'created_at',
            'updated_at', 'recent_results'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_details',
            'pipeline_details', 'last_run', 'last_result', 'recent_results'
        ]

    def get_recent_results(self, obj):
        results = obj.results.all()[:5]
        return DataQualityResultListSerializer(results, many=True).data


class DataQualityCheckListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing quality checks"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)

    class Meta:
        model = DataQualityCheck
        fields = [
            'id', 'name', 'check_type', 'pipeline_name', 'severity',
            'enabled', 'last_run', 'last_result', 'created_at'
        ]
        read_only_fields = fields


class DataQualityResultSerializer(serializers.ModelSerializer):
    """Serializer for DataQualityResult model"""

    quality_check_name = serializers.CharField(source='quality_check.name', read_only=True)

    class Meta:
        model = DataQualityResult
        fields = [
            'id', 'quality_check', 'quality_check_name', 'result',
            'total_records', 'passed_records', 'failed_records',
            'pass_percentage', 'execution_time', 'error_message',
            'details', 'executed_at'
        ]
        read_only_fields = ['id', 'executed_at', 'quality_check_name']


class DataQualityResultListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing quality results"""

    quality_check_name = serializers.CharField(source='quality_check.name', read_only=True)

    class Meta:
        model = DataQualityResult
        fields = [
            'id', 'quality_check_name', 'result', 'pass_percentage',
            'total_records', 'executed_at'
        ]
        read_only_fields = fields


class NotebookSerializer(serializers.ModelSerializer):
    """Serializer for Notebook model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Notebook
        fields = [
            'id', 'workspace', 'name', 'description', 'language', 'kernel',
            'content', 'cell_count', 'status', 'last_executed',
            'created_by', 'created_by_name', 'created_by_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_details',
            'created_by_name', 'last_executed', 'status'
        ]


class NotebookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing notebooks"""

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Notebook
        fields = [
            'id', 'name', 'description', 'language', 'kernel',
            'cell_count', 'status', 'last_executed', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields

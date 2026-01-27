"""
Serializers for data governance - catalog, lineage, quality, and policies.
"""

from rest_framework import serializers
from .models import (
    DataAsset,
    DataLineage,
    DataQualityRule,
    DataQualityResult,
    GlossaryTerm,
    Policy,
)


class DataAssetSerializer(serializers.ModelSerializer):
    """Serializer for data assets in the catalog."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    tags_list = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = DataAsset
        fields = [
            'id', 'workspace', 'name', 'description', 'asset_type',
            'schema_name', 'table_name', 'location', 'format',
            'owner', 'owner_name', 'tags', 'tags_list',
            'metadata', 'is_certified', 'certified_by', 'certified_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'certified_at']
    
    def validate_tags_list(self, value):
        """Convert tags list to comma-separated string."""
        return value
    
    def create(self, validated_data):
        tags_list = validated_data.pop('tags_list', None)
        if tags_list:
            validated_data['tags'] = ','.join(tags_list)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        tags_list = validated_data.pop('tags_list', None)
        if tags_list is not None:
            validated_data['tags'] = ','.join(tags_list)
        return super().update(instance, validated_data)


class DataLineageSerializer(serializers.ModelSerializer):
    """Serializer for data lineage relationships."""
    source_asset_name = serializers.CharField(source='source_asset.name', read_only=True)
    target_asset_name = serializers.CharField(source='target_asset.name', read_only=True)
    
    class Meta:
        model = DataLineage
        fields = [
            'id', 'source_asset', 'source_asset_name',
            'target_asset', 'target_asset_name',
            'transformation_type', 'transformation_logic',
            'pipeline', 'metadata', 'created_at',
        ]
        read_only_fields = ['created_at']


class DataQualityRuleSerializer(serializers.ModelSerializer):
    """Serializer for data quality rules."""
    asset_name = serializers.CharField(source='data_asset.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = DataQualityRule
        fields = [
            'id', 'workspace', 'name', 'description', 'rule_type',
            'data_asset', 'asset_name', 'column_name',
            'expression', 'threshold', 'severity',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class DataQualityResultSerializer(serializers.ModelSerializer):
    """Serializer for data quality check results."""
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    rule_severity = serializers.CharField(source='rule.severity', read_only=True)
    
    class Meta:
        model = DataQualityResult
        fields = [
            'id', 'rule', 'rule_name', 'rule_severity',
            'passed', 'actual_value', 'expected_value',
            'records_checked', 'records_failed', 'failure_percentage',
            'error_message', 'execution_time_ms', 'executed_at',
        ]
        read_only_fields = ['executed_at']


class GlossaryTermSerializer(serializers.ModelSerializer):
    """Serializer for business glossary terms."""
    owner_name = serializers.CharField(source='owner.email', read_only=True)
    related_terms_data = serializers.SerializerMethodField()
    
    class Meta:
        model = GlossaryTerm
        fields = [
            'id', 'workspace', 'term', 'definition', 'category',
            'synonyms', 'related_terms', 'related_terms_data',
            'owner', 'owner_name', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_related_terms_data(self, obj):
        """Get basic info for related terms."""
        return [
            {'id': term.id, 'term': term.term}
            for term in obj.related_terms.all()[:5]
        ]


class PolicySerializer(serializers.ModelSerializer):
    """Serializer for data governance policies."""
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Policy
        fields = [
            'id', 'workspace', 'name', 'description', 'policy_type',
            'rules', 'applies_to', 'enforcement_level',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class LineageGraphSerializer(serializers.Serializer):
    """Serializer for lineage graph visualization."""
    nodes = serializers.ListField(child=serializers.DictField())
    edges = serializers.ListField(child=serializers.DictField())


class DataQualitySummarySerializer(serializers.Serializer):
    """Serializer for data quality summary."""
    total_rules = serializers.IntegerField()
    active_rules = serializers.IntegerField()
    passed_checks = serializers.IntegerField()
    failed_checks = serializers.IntegerField()
    pass_rate = serializers.FloatField()
    by_severity = serializers.DictField()

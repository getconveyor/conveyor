from rest_framework import serializers
from .models import Source, Pipeline, PipelineRun, Schedule, SourceCatalog
from authentication.serializers import UserSerializer


class SourceCatalogSerializer(serializers.ModelSerializer):
    """Serializer for SourceCatalog model"""

    class Meta:
        model = SourceCatalog
        fields = ['id', 'name', 'category', 'description', 'auth_types', 'documentation', 'popular']
        read_only_fields = ['id', 'name', 'category', 'description', 'auth_types', 'documentation', 'popular']


class SourceSerializer(serializers.ModelSerializer):
    """Serializer for Source model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Source
        fields = [
            'id', 'workspace', 'name', 'type', 'host', 'port',
            'database', 'username', 'password', 'ssl',
            'status', 'last_tested', 'config', 'created_by',
            'created_by_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'workspace', 'created_at', 'updated_at', 'created_by_details', 'created_by', 'status', 'last_tested']

    def create(self, validated_data):
        """Handle password encryption on create"""
        password = validated_data.pop('password', None)
        source = Source.objects.create(**validated_data)
        if password:
            source.set_password(password)
            source.save()
        return source

    def update(self, instance, validated_data):
        """Handle password encryption on update"""
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class SourceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing sources"""

    class Meta:
        model = Source
        fields = [
            'id', 'name', 'type', 'host', 'port', 'database', 'username',
            'ssl', 'config', 'status', 'last_tested', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


# class DataSourceSerializer(serializers.ModelSerializer):
#     """Serializer for DataSource model"""

#     source_details = SourceListSerializer(source='source', read_only=True)

#     class Meta:
#         model = DataSource
#         fields = [
#             'id', 'workspace', 'source', 'source_details',
#             'name', 'type', 'tables', 'status', 'last_sync',
#             'record_count', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at', 'source_details']


# class DataSourceListSerializer(serializers.ModelSerializer):
#     """Lightweight serializer for listing data sources"""

#     source_name = serializers.CharField(source='source.name', read_only=True)
#     source_type = serializers.CharField(source='source.type', read_only=True)

#     class Meta:
#         model = DataSource
#         fields = [
#             'id', 'name', 'type', 'source_name', 'source_type',
#             'status', 'last_sync', 'record_count', 'created_at'
#         ]
#         read_only_fields = fields


class PipelineSerializer(serializers.ModelSerializer):
    """Serializer for Pipeline model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    source_details = SourceListSerializer(source='source', read_only=True)
    destination_details = SourceListSerializer(source='destination', read_only=True)

    class Meta:
        model = Pipeline
        fields = [
            'id', 'workspace', 'name', 'description', 'status',
            'source', 'source_details',
            'destination', 'destination_details',
            'schedule', 'last_run', 'next_run', 'run_count',
            'success_rate', 'records_processed', 'config',
            'created_by', 'created_by_details', 'created_at', 'updated_at',
            'is_scheduled'
        ]
        read_only_fields = [
            'id', 'workspace', 'created_at', 'updated_at', 'created_by_details', 'created_by',
            'source_details', 'destination_details',
            'is_scheduled', 'run_count', 'success_rate', 'records_processed',
            'last_run', 'next_run', 'status'
        ]


class PipelineListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing pipelines"""

    source_name = serializers.CharField(source='source.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)

    class Meta:
        model = Pipeline
        fields = [
            'id', 'name', 'status', 'source_name', 'destination_name',
            'last_run', 'next_run', 'run_count', 'success_rate',
            'is_scheduled', 'created_at'
        ]
        read_only_fields = fields


class PipelineRunSerializer(serializers.ModelSerializer):
    """Serializer for PipelineRun model"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    triggered_by_user_details = UserSerializer(source='triggered_by_user', read_only=True)

    class Meta:
        model = PipelineRun
        fields = [
            'id', 'pipeline', 'pipeline_name', 'status', 'start_time',
            'end_time', 'duration', 'records_processed', 'bytes_processed',
            'errors', 'metrics', 'triggered_by', 'triggered_by_user',
            'triggered_by_user_details', 'created_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'pipeline_name', 'triggered_by_user_details'
        ]


class PipelineRunListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing pipeline runs"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)

    class Meta:
        model = PipelineRun
        fields = [
            'id', 'pipeline_name', 'status', 'start_time', 'end_time',
            'duration', 'records_processed', 'triggered_by', 'created_at'
        ]
        read_only_fields = fields


class ScheduleSerializer(serializers.ModelSerializer):
    """Serializer for Schedule model"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)

    class Meta:
        model = Schedule
        fields = [
            'id', 'workspace', 'pipeline', 'pipeline_name', 'name',
            'cron_expression', 'timezone', 'enabled', 'last_run',
            'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'pipeline_name']

    def validate_cron_expression(self, value):
        """Validate cron expression format"""
        # Basic validation - can be enhanced with croniter library
        parts = value.strip().split()
        if len(parts) != 5:
            raise serializers.ValidationError(
                "Cron expression must have 5 parts: minute hour day month day_of_week"
            )
        return value


class ScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing schedules"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)

    class Meta:
        model = Schedule
        fields = [
            'id', 'name', 'pipeline_name', 'cron_expression',
            'enabled', 'next_run', 'last_run'
        ]
        read_only_fields = fields

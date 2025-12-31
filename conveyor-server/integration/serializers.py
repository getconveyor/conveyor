from rest_framework import serializers
from .models import Connection, DataSource, Pipeline, PipelineRun, Schedule
from authentication.serializers import UserSerializer


class ConnectionSerializer(serializers.ModelSerializer):
    """Serializer for Connection model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Connection
        fields = [
            'id', 'workspace', 'name', 'type', 'host', 'port',
            'database', 'username', 'password_encrypted', 'ssl',
            'status', 'last_tested', 'config', 'created_by',
            'created_by_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_details']
        extra_kwargs = {
            'password_encrypted': {'write_only': True}
        }


class ConnectionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing connections"""

    class Meta:
        model = Connection
        fields = [
            'id', 'name', 'type', 'status', 'last_tested',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields


class DataSourceSerializer(serializers.ModelSerializer):
    """Serializer for DataSource model"""

    connection_details = ConnectionListSerializer(source='connection', read_only=True)

    class Meta:
        model = DataSource
        fields = [
            'id', 'workspace', 'connection', 'connection_details',
            'name', 'type', 'tables', 'status', 'last_sync',
            'record_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'connection_details']


class DataSourceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing data sources"""

    connection_name = serializers.CharField(source='connection.name', read_only=True)
    connection_type = serializers.CharField(source='connection.type', read_only=True)

    class Meta:
        model = DataSource
        fields = [
            'id', 'name', 'type', 'connection_name', 'connection_type',
            'status', 'last_sync', 'record_count', 'created_at'
        ]
        read_only_fields = fields


class PipelineSerializer(serializers.ModelSerializer):
    """Serializer for Pipeline model"""

    created_by_details = UserSerializer(source='created_by', read_only=True)
    source_connection_details = ConnectionListSerializer(source='source_connection', read_only=True)
    destination_connection_details = ConnectionListSerializer(source='destination_connection', read_only=True)

    class Meta:
        model = Pipeline
        fields = [
            'id', 'workspace', 'name', 'description', 'status',
            'source_connection', 'source_connection_details',
            'destination_connection', 'destination_connection_details',
            'schedule', 'last_run', 'next_run', 'run_count',
            'success_rate', 'records_processed', 'config',
            'created_by', 'created_by_details', 'created_at', 'updated_at',
            'is_scheduled'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_details',
            'source_connection_details', 'destination_connection_details',
            'is_scheduled', 'run_count', 'success_rate', 'records_processed',
            'last_run', 'next_run'
        ]


class PipelineListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing pipelines"""

    source_name = serializers.CharField(source='source_connection.name', read_only=True)
    destination_name = serializers.CharField(source='destination_connection.name', read_only=True)

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

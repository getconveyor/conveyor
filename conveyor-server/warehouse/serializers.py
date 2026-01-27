from rest_framework import serializers
from .models import QueryHistory


class QueryExecuteSerializer(serializers.Serializer):
    """Serializer for executing a Trino query"""
    query = serializers.CharField(required=True)
    namespace = serializers.CharField(default='iceberg')
    schema = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(default=1000, min_value=1, max_value=10000)


class QueryHistorySerializer(serializers.ModelSerializer):
    """Serializer for QueryHistory model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    execution_time_display = serializers.SerializerMethodField()

    class Meta:
        model = QueryHistory
        fields = [
            'id', 'workspace_id', 'user', 'user_email',
            'name', 'query_text', 'namespace', 'schema',
            'status', 'rows_returned', 'execution_time_ms',
            'execution_time_display', 'error_message',
            'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'workspace_id', 'user', 'status',
            'rows_returned', 'execution_time_ms', 'error_message',
            'created_at', 'completed_at'
        ]

    def get_execution_time_display(self, obj):
        """Format execution time for display"""
        if obj.execution_time_ms is None:
            return '-'
        if obj.execution_time_ms < 1000:
            return f"{obj.execution_time_ms}ms"
        return f"{obj.execution_time_ms / 1000:.2f}s"


class TableListSerializer(serializers.Serializer):
    """Serializer for listing Iceberg tables"""
    namespace = serializers.CharField(default='iceberg')
    schema = serializers.CharField(required=False, allow_blank=True)
    layer = serializers.ChoiceField(
        choices=['bronze', 'silver', 'gold'],
        required=False
    )

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
    schedule_description = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = [
            'id', 'workspace', 'pipeline', 'pipeline_name', 'name',
            'schedule_type', 'schedule_config', 'cron_expression',
            'schedule_description', 'timezone', 'enabled', 'last_run',
            'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'workspace', 'created_at', 'updated_at', 'pipeline_name',
            'next_run', 'last_run', 'cron_expression', 'schedule_description'
        ]

    def get_schedule_description(self, obj):
        """Get human-readable schedule description"""
        return Schedule.get_schedule_description(
            obj.schedule_type, 
            obj.schedule_config or {}, 
            obj.timezone
        )

    def validate_schedule_config(self, value):
        """Validate schedule_config based on schedule_type"""
        schedule_type = self.initial_data.get('schedule_type', 'daily')
        
        if schedule_type == 'hourly':
            interval = value.get('interval', 1)
            if not isinstance(interval, int) or interval < 1 or interval > 24:
                raise serializers.ValidationError(
                    "Hourly interval must be between 1 and 24"
                )
        
        elif schedule_type == 'daily':
            hour = value.get('hour', 0)
            minute = value.get('minute', 0)
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise serializers.ValidationError(
                    "Invalid time: hour must be 0-23, minute must be 0-59"
                )
        
        elif schedule_type == 'weekly':
            days = value.get('days', [])
            if not days or not all(0 <= d <= 6 for d in days):
                raise serializers.ValidationError(
                    "Days must be a list of integers 0-6 (Sun-Sat)"
                )
            hour = value.get('hour', 0)
            minute = value.get('minute', 0)
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise serializers.ValidationError(
                    "Invalid time: hour must be 0-23, minute must be 0-59"
                )
        
        elif schedule_type == 'monthly':
            day = value.get('day', 1)
            if not isinstance(day, int) or day < 1 or day > 31:
                raise serializers.ValidationError(
                    "Day must be between 1 and 31"
                )
            hour = value.get('hour', 0)
            minute = value.get('minute', 0)
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise serializers.ValidationError(
                    "Invalid time: hour must be 0-23, minute must be 0-59"
                )
        
        elif schedule_type == 'cron':
            expression = value.get('expression', '')
            if not expression:
                raise serializers.ValidationError(
                    "Cron expression is required for custom schedule"
                )
            parts = expression.strip().split()
            if len(parts) != 5:
                raise serializers.ValidationError(
                    "Cron expression must have 5 parts: minute hour day month day_of_week"
                )
        
        return value

    def create(self, validated_data):
        """Build cron expression and calculate next_run on create"""
        from croniter import croniter
        from django.utils import timezone
        import pytz

        schedule_type = validated_data.get('schedule_type', 'daily')
        schedule_config = validated_data.get('schedule_config', {})
        tz_name = validated_data.get('timezone', 'UTC')

        # Build cron expression from user-friendly config
        cron_expression = Schedule.build_cron_expression(schedule_type, schedule_config)
        validated_data['cron_expression'] = cron_expression

        # Calculate next run time
        try:
            tz = pytz.timezone(tz_name)
            base_time = timezone.now().astimezone(tz)
            cron = croniter(cron_expression, base_time)
            validated_data['next_run'] = cron.get_next(timezone.datetime)
        except Exception:
            validated_data['next_run'] = timezone.now() + timezone.timedelta(hours=1)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Rebuild cron expression and recalculate next_run if schedule changes"""
        from croniter import croniter
        from django.utils import timezone
        import pytz

        schedule_type = validated_data.get('schedule_type', instance.schedule_type)
        schedule_config = validated_data.get('schedule_config', instance.schedule_config)
        tz_name = validated_data.get('timezone', instance.timezone)

        # Rebuild cron if schedule config changed
        if 'schedule_type' in validated_data or 'schedule_config' in validated_data:
            cron_expression = Schedule.build_cron_expression(schedule_type, schedule_config)
            validated_data['cron_expression'] = cron_expression

            try:
                tz = pytz.timezone(tz_name)
                base_time = timezone.now().astimezone(tz)
                cron = croniter(cron_expression, base_time)
                validated_data['next_run'] = cron.get_next(timezone.datetime)
            except Exception:
                pass

        return super().update(instance, validated_data)


class ScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing schedules"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    schedule_description = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = [
            'id', 'name', 'pipeline_name', 'schedule_type', 'schedule_description',
            'enabled', 'next_run', 'last_run'
        ]
        read_only_fields = fields

    def get_schedule_description(self, obj):
        """Get human-readable schedule description"""
        return Schedule.get_schedule_description(
            obj.schedule_type, 
            obj.schedule_config or {}, 
            obj.timezone
        )

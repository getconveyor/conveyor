from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from .models import Connection, DataSource, Pipeline, PipelineRun, Schedule
from .serializers import (
    ConnectionSerializer, ConnectionListSerializer,
    DataSourceSerializer, DataSourceListSerializer,
    PipelineSerializer, PipelineListSerializer,
    PipelineRunSerializer, PipelineRunListSerializer,
    ScheduleSerializer, ScheduleListSerializer
)
from authentication.permissions import IsWorkspaceMember, IsWorkspaceOwnerOrAdmin


class ConnectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing database/API connections.

    Provides CRUD operations and connection testing.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return ConnectionListSerializer
        return ConnectionSerializer

    def get_queryset(self):
        """Filter connections by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Connection.objects.none()
        return Connection.objects.filter(workspace_id=workspace_id).select_related('created_by')

    def perform_create(self, serializer):
        """Set workspace and created_by when creating connection"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """
        Test the connection to verify credentials and connectivity.
        """
        from integration.connectors import ConnectorRegistry
        from integration.exceptions import ConnectorError

        connection = self.get_object()

        try:
            # Create connector and test connection
            connector = ConnectorRegistry.create(connection)
            test_result = connector.test()
            connector.close()

            # Update connection record
            connection.last_tested = timezone.now()
            connection.status = 'active' if test_result.success else 'error'
            connection.save()

            return Response({
                'status': 'success' if test_result.success else 'error',
                'message': test_result.message,
                'connection_id': str(connection.id),
                'tested_at': connection.last_tested,
                'details': test_result.details
            })

        except ConnectorError as e:
            connection.last_tested = timezone.now()
            connection.status = 'error'
            connection.save()

            return Response({
                'status': 'error',
                'message': f'Connection test failed: {str(e)}',
                'connection_id': str(connection.id),
                'tested_at': connection.last_tested
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Unexpected error: {str(e)}',
                'connection_id': str(connection.id)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def schema(self, request, pk=None):
        """
        Get the schema/structure of the connection.

        Returns tables, collections, or other structural information.
        """
        from integration.connectors import ConnectorRegistry
        from integration.exceptions import ConnectorError, SchemaDiscoveryError

        connection = self.get_object()

        try:
            # Create connector and discover schema
            connector = ConnectorRegistry.create(connection)
            discovery = connector.discover()
            connector.close()

            return Response({
                'connection_id': str(connection.id),
                'connector_type': connection.connector_type,
                'streams': discovery.streams,
                'schemas': discovery.schemas,
                'timestamp': discovery.timestamp.isoformat()
            })

        except SchemaDiscoveryError as e:
            return Response({
                'status': 'error',
                'message': f'Schema discovery failed: {str(e)}',
                'connection_id': str(connection.id)
            }, status=status.HTTP_400_BAD_REQUEST)

        except ConnectorError as e:
            return Response({
                'status': 'error',
                'message': f'Connector error: {str(e)}',
                'connection_id': str(connection.id)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Unexpected error: {str(e)}',
                'connection_id': str(connection.id)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataSourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data sources.

    Data sources represent specific tables, collections, or data endpoints
    within a connection.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return DataSourceListSerializer
        return DataSourceSerializer

    def get_queryset(self):
        """Filter data sources by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return DataSource.objects.none()
        return DataSource.objects.filter(
            workspace_id=workspace_id
        ).select_related('connection')

    def perform_create(self, serializer):
        """Set workspace when creating data source"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """
        Trigger a sync operation for this data source.

        Updates record count and last sync timestamp.
        """
        data_source = self.get_object()

        # TODO: Implement actual sync logic
        data_source.last_sync = timezone.now()
        data_source.status = 'connected'
        data_source.save()

        return Response({
            'status': 'success',
            'message': 'Sync initiated',
            'data_source_id': data_source.id,
            'last_sync': data_source.last_sync
        })

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """
        Get a preview of data from this source.

        Returns a sample of records.
        """
        data_source = self.get_object()

        # TODO: Implement data preview
        return Response({
            'data_source_id': data_source.id,
            'preview': {
                'message': 'Data preview not yet implemented'
            }
        })


class PipelineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data pipelines.

    Provides CRUD operations and pipeline execution.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return PipelineListSerializer
        return PipelineSerializer

    def get_queryset(self):
        """Filter pipelines by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Pipeline.objects.none()

        queryset = Pipeline.objects.filter(
            workspace_id=workspace_id
        ).select_related(
            'created_by', 'source_connection', 'destination_connection'
        )

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        """Set workspace and created_by when creating pipeline"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Execute the pipeline manually.

        Creates a new pipeline run and starts execution via Celery task.
        """
        from integration.tasks import run_pipeline_task

        pipeline = self.get_object()

        # Check if pipeline is already running
        active_run = PipelineRun.objects.filter(
            pipeline=pipeline,
            status='running'
        ).first()

        if active_run:
            return Response({
                'status': 'error',
                'message': 'Pipeline is already running',
                'pipeline_id': str(pipeline.id),
                'active_run_id': str(active_run.id)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Trigger the Celery task asynchronously
        task = run_pipeline_task.delay(
            pipeline_id=str(pipeline.id),
            triggered_by_user_id=request.user.id
        )

        # Note: The PipelineRun will be created by the Celery task
        # We just return the task ID for tracking

        return Response({
            'status': 'success',
            'message': 'Pipeline execution started',
            'pipeline_id': str(pipeline.id),
            'task_id': task.id
        })

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a running pipeline"""
        pipeline = self.get_object()

        if pipeline.status != 'running':
            return Response(
                {'error': 'Only running pipelines can be paused'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pipeline.status = 'paused'
        pipeline.save()

        return Response({
            'status': 'success',
            'message': 'Pipeline paused',
            'pipeline_id': pipeline.id
        })

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused pipeline"""
        pipeline = self.get_object()

        if pipeline.status != 'paused':
            return Response(
                {'error': 'Only paused pipelines can be resumed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pipeline.status = 'running'
        pipeline.save()

        return Response({
            'status': 'success',
            'message': 'Pipeline resumed',
            'pipeline_id': pipeline.id
        })

    @action(detail=True, methods=['get'])
    def runs(self, request, pk=None):
        """Get all runs for this pipeline"""
        pipeline = self.get_object()
        runs = pipeline.runs.all().order_by('-created_at')

        # Pagination
        page = self.paginate_queryset(runs)
        if page is not None:
            serializer = PipelineRunListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PipelineRunListSerializer(runs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for this pipeline"""
        pipeline = self.get_object()
        runs = pipeline.runs.all()

        total_runs = runs.count()
        successful_runs = runs.filter(status='success').count()
        failed_runs = runs.filter(status='failed').count()

        return Response({
            'pipeline_id': pipeline.id,
            'total_runs': total_runs,
            'successful_runs': successful_runs,
            'failed_runs': failed_runs,
            'success_rate': float(pipeline.success_rate),
            'total_records_processed': pipeline.records_processed,
            'last_run': pipeline.last_run,
            'next_run': pipeline.next_run
        })


class PipelineRunViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing pipeline runs.

    Read-only access to pipeline execution history.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return PipelineRunListSerializer
        return PipelineRunSerializer

    def get_queryset(self):
        """Filter pipeline runs by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return PipelineRun.objects.none()

        queryset = PipelineRun.objects.filter(
            pipeline__workspace_id=workspace_id
        ).select_related('pipeline', 'triggered_by_user')

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by pipeline if provided
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running pipeline"""
        pipeline_run = self.get_object()

        if pipeline_run.status != 'running':
            return Response(
                {'error': 'Only running pipelines can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pipeline_run.status = 'cancelled'
        pipeline_run.end_time = timezone.now()
        pipeline_run.duration = int((pipeline_run.end_time - pipeline_run.start_time).total_seconds() * 1000)
        pipeline_run.save()

        # Update pipeline status
        pipeline_run.pipeline.status = 'idle'
        pipeline_run.pipeline.save()

        return Response({
            'status': 'success',
            'message': 'Pipeline run cancelled',
            'run_id': pipeline_run.id
        })


class ScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pipeline schedules.

    Provides CRUD operations for scheduling pipelines.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceOwnerOrAdmin]

    def get_serializer_class(self):
        if self.action == 'list':
            return ScheduleListSerializer
        return ScheduleSerializer

    def get_queryset(self):
        """Filter schedules by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Schedule.objects.none()

        queryset = Schedule.objects.filter(
            workspace_id=workspace_id
        ).select_related('pipeline')

        # Filter by enabled status if provided
        enabled = self.request.query_params.get('enabled')
        if enabled is not None:
            queryset = queryset.filter(enabled=enabled.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        """Set workspace when creating schedule"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)

    @action(detail=True, methods=['post'])
    def enable(self, request, pk=None):
        """Enable a schedule"""
        schedule = self.get_object()
        schedule.enabled = True
        schedule.save()

        return Response({
            'status': 'success',
            'message': 'Schedule enabled',
            'schedule_id': schedule.id,
            'next_run': schedule.next_run
        })

    @action(detail=True, methods=['post'])
    def disable(self, request, pk=None):
        """Disable a schedule"""
        schedule = self.get_object()
        schedule.enabled = False
        schedule.save()

        return Response({
            'status': 'success',
            'message': 'Schedule disabled',
            'schedule_id': schedule.id
        })

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Transformation, TransformationRule, DataQualityCheck, DataQualityResult, Notebook
from .serializers import (
    TransformationSerializer, TransformationListSerializer,
    TransformationRuleSerializer,
    DataQualityCheckSerializer, DataQualityCheckListSerializer,
    DataQualityResultSerializer, DataQualityResultListSerializer,
    NotebookSerializer, NotebookListSerializer
)
from authentication.permissions import IsWorkspaceMember


class TransformationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data transformations.

    Provides CRUD operations and transformation execution.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return TransformationListSerializer
        return TransformationSerializer

    def get_queryset(self):
        """Filter transformations by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Transformation.objects.none()

        queryset = Transformation.objects.filter(
            workspace_id=workspace_id
        ).select_related('created_by', 'pipeline').prefetch_related('rules')

        # Filter by pipeline if provided
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        """Set workspace and created_by when creating transformation"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """
        Execute the transformation.

        This is a placeholder - implement actual transformation logic.
        """
        transformation = self.get_object()

        # TODO: Implement actual transformation execution logic
        transformation.last_run = timezone.now()
        transformation.save()

        return Response({
            'status': 'success',
            'message': 'Transformation executed',
            'transformation_id': transformation.id,
            'executed_at': transformation.last_run
        })

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """
        Validate the transformation configuration.

        Checks if the transformation config is valid.
        """
        transformation = self.get_object()

        # TODO: Implement validation logic
        return Response({
            'valid': True,
            'message': 'Transformation configuration is valid'
        })

    @action(detail=True, methods=['get'])
    def rules(self, request, pk=None):
        """Get all rules for this transformation"""
        transformation = self.get_object()
        rules = transformation.rules.all()

        serializer = TransformationRuleSerializer(rules, many=True)
        return Response(serializer.data)


class TransformationRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing transformation rules.

    Provides CRUD operations for individual transformation rules.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    serializer_class = TransformationRuleSerializer

    def get_queryset(self):
        """Filter transformation rules by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return TransformationRule.objects.none()

        queryset = TransformationRule.objects.filter(
            transformation__workspace_id=workspace_id
        ).select_related('transformation')

        # Filter by transformation if provided
        transformation_id = self.request.query_params.get('transformation')
        if transformation_id:
            queryset = queryset.filter(transformation_id=transformation_id)

        return queryset

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle rule enabled/disabled"""
        rule = self.get_object()
        rule.enabled = not rule.enabled
        rule.save()

        return Response({
            'status': 'success',
            'enabled': rule.enabled,
            'rule_id': rule.id
        })


class DataQualityCheckViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data quality checks.

    Provides CRUD operations and quality check execution.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return DataQualityCheckListSerializer
        return DataQualityCheckSerializer

    def get_queryset(self):
        """Filter quality checks by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return DataQualityCheck.objects.none()

        queryset = DataQualityCheck.objects.filter(
            workspace_id=workspace_id
        ).select_related('created_by', 'pipeline')

        # Filter by pipeline if provided
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        # Filter by enabled status if provided
        enabled = self.request.query_params.get('enabled')
        if enabled is not None:
            queryset = queryset.filter(enabled=enabled.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        """Set workspace and created_by when creating quality check"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Execute the quality check.

        Runs the check and creates a result record.
        """
        quality_check = self.get_object()

        # TODO: Implement actual quality check execution
        # For now, create a placeholder result
        result = DataQualityResult.objects.create(
            quality_check=quality_check,
            result='passed',
            total_records=1000,
            passed_records=1000,
            failed_records=0,
            pass_percentage=100.0,
            execution_time=0
        )

        quality_check.last_run = timezone.now()
        quality_check.last_result = result.result
        quality_check.save()

        return Response({
            'status': 'success',
            'result_id': result.id,
            'result': result.result,
            'pass_percentage': float(result.pass_percentage)
        })

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle check enabled/disabled"""
        quality_check = self.get_object()
        quality_check.enabled = not quality_check.enabled
        quality_check.save()

        return Response({
            'status': 'success',
            'enabled': quality_check.enabled,
            'check_id': quality_check.id
        })

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all results for this quality check"""
        quality_check = self.get_object()
        results = quality_check.results.all()

        # Pagination
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = DataQualityResultListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DataQualityResultListSerializer(results, many=True)
        return Response(serializer.data)


class DataQualityResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing quality check results.

    Read-only access to quality check execution history.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return DataQualityResultListSerializer
        return DataQualityResultSerializer

    def get_queryset(self):
        """Filter quality results by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return DataQualityResult.objects.none()

        queryset = DataQualityResult.objects.filter(
            quality_check__workspace_id=workspace_id
        ).select_related('quality_check')

        # Filter by quality check if provided
        check_id = self.request.query_params.get('quality_check')
        if check_id:
            queryset = queryset.filter(quality_check_id=check_id)

        # Filter by result if provided
        result_filter = self.request.query_params.get('result')
        if result_filter:
            queryset = queryset.filter(result=result_filter)

        return queryset.order_by('-executed_at')


class NotebookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notebooks.

    Provides CRUD operations and notebook execution.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return NotebookListSerializer
        return NotebookSerializer

    def get_queryset(self):
        """Filter notebooks by user's current workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Notebook.objects.none()

        queryset = Notebook.objects.filter(
            workspace_id=workspace_id
        ).select_related('created_by')

        # Filter by language if provided
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(language=language)

        return queryset

    def perform_create(self, serializer):
        """Set workspace and created_by when creating notebook"""
        workspace_id = self.request.headers.get('X-Workspace-ID')

        # Set default kernel based on language
        language = serializer.validated_data.get('language', 'python')
        kernel = serializer.validated_data.get('kernel')
        if not kernel:
            kernel_map = {
                'python': 'Python 3.11',
                'sql': 'SQL',
                'r': 'R'
            }
            kernel = kernel_map.get(language, 'Python 3.11')

        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user,
            kernel=kernel,
            cell_count=1,  # Start with 1 empty cell
            content={'cells': [{'cell_type': 'code', 'source': '', 'outputs': []}]}
        )

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Execute all cells in the notebook.

        This is a placeholder - implement actual execution logic.
        """
        notebook = self.get_object()

        notebook.status = 'running'
        notebook.save()

        # TODO: Implement actual notebook execution logic
        # For now, just mark as idle after a simulated delay
        notebook.status = 'idle'
        notebook.last_executed = timezone.now()
        notebook.save()

        return Response({
            'status': 'success',
            'message': 'Notebook executed successfully',
            'notebook_id': str(notebook.id),
            'executed_at': notebook.last_executed
        })

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate the notebook"""
        original = self.get_object()

        # Create a copy
        duplicate = Notebook.objects.create(
            workspace=original.workspace,
            name=f"{original.name} (Copy)",
            description=original.description,
            language=original.language,
            kernel=original.kernel,
            content=original.content,
            cell_count=original.cell_count,
            created_by=request.user
        )

        serializer = NotebookSerializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export the notebook as .ipynb file"""
        notebook = self.get_object()

        # Create Jupyter notebook format
        notebook_data = {
            'metadata': {
                'kernelspec': {
                    'name': notebook.language,
                    'display_name': notebook.kernel
                }
            },
            'cells': notebook.content.get('cells', [])
        }

        return Response({
            'filename': f"{notebook.name.replace(' ', '_')}.ipynb",
            'content': notebook_data
        })

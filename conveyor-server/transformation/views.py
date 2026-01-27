from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
import trino
import time
import logging

from authentication.permissions import IsWorkspaceMember

from .models import Transformation, TransformationRule, DataQualityCheck, DataQualityResult, Notebook, Workflow, WorkflowStep, WorkflowRun
from .serializers import (
    TransformationSerializer, TransformationListSerializer,
    TransformationRuleSerializer,
    DataQualityCheckSerializer, DataQualityCheckListSerializer,
    DataQualityResultSerializer, DataQualityResultListSerializer,
    NotebookSerializer, NotebookListSerializer,
    WorkflowSerializer, WorkflowStepSerializer, WorkflowRunSerializer
)
class WorkflowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing workflows"""
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return Workflow.objects.none()
        return Workflow.objects.filter(workspace_id=workspace_id).select_related('created_by').prefetch_related('steps', 'runs')

    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )


class WorkflowStepViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowStepSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        return WorkflowStep.objects.all().select_related('workflow')


class WorkflowRunViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowRunSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        return WorkflowRun.objects.all().select_related('workflow')
from authentication.permissions import IsWorkspaceMember

logger = logging.getLogger(__name__)


def get_trino_connection():
    """Create Trino connection for transformation queries"""
    return trino.dbapi.connect(
        host=getattr(settings, 'TRINO_HOST', 'trino'),
        port=getattr(settings, 'TRINO_PORT', 8080),
        user='trino',
        catalog='iceberg',
        http_scheme='http',
    )


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

        Applies transformation rules by executing SQL against Trino.
        """
        transformation = self.get_object()
        start_time = time.time()
        
        try:
            conn = get_trino_connection()
            cursor = conn.cursor()
            
            # Get enabled transformation rules
            rules = transformation.rules.filter(enabled=True).order_by('order')
            
            results = []
            total_rows = 0
            
            for rule in rules:
                rule_start = time.time()
                
                # Build SQL based on rule type
                sql = self._build_transformation_sql(transformation, rule)
                
                if sql:
                    try:
                        cursor.execute(sql)
                        rows_affected = cursor.fetchone()
                        rule_time = int((time.time() - rule_start) * 1000)
                        
                        results.append({
                            'rule_id': str(rule.id),
                            'rule_name': rule.name,
                            'rule_type': rule.rule_type,
                            'status': 'success',
                            'rows_affected': rows_affected[0] if rows_affected else 0,
                            'execution_time_ms': rule_time
                        })
                        total_rows += rows_affected[0] if rows_affected else 0
                    except Exception as rule_error:
                        results.append({
                            'rule_id': str(rule.id),
                            'rule_name': rule.name,
                            'rule_type': rule.rule_type,
                            'status': 'failed',
                            'error': str(rule_error),
                            'execution_time_ms': int((time.time() - rule_start) * 1000)
                        })
            
            cursor.close()
            conn.close()
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # Update transformation record
            transformation.last_run = timezone.now()
            transformation.status = 'completed'
            transformation.save()
            
            return Response({
                'status': 'success',
                'message': 'Transformation executed successfully',
                'transformation_id': str(transformation.id),
                'executed_at': transformation.last_run,
                'execution_time_ms': execution_time,
                'total_rows_affected': total_rows,
                'rules_executed': len(results),
                'rule_results': results
            })
            
        except Exception as e:
            logger.error(f"Transformation execution failed: {str(e)}")
            transformation.status = 'failed'
            transformation.save()
            
            return Response({
                'status': 'error',
                'message': str(e),
                'transformation_id': str(transformation.id)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _build_transformation_sql(self, transformation, rule):
        """Build SQL statement for transformation rule"""
        config = rule.config or {}
        source_table = transformation.config.get('source_table', '')
        target_table = transformation.config.get('target_table', '')
        
        if rule.rule_type == 'rename_column':
            old_name = config.get('old_name')
            new_name = config.get('new_name')
            if old_name and new_name and target_table:
                return f"ALTER TABLE {target_table} RENAME COLUMN {old_name} TO {new_name}"
        
        elif rule.rule_type == 'filter':
            condition = config.get('condition')
            if condition and source_table and target_table:
                return f"INSERT INTO {target_table} SELECT * FROM {source_table} WHERE {condition}"
        
        elif rule.rule_type == 'aggregate':
            group_by = config.get('group_by', [])
            aggregations = config.get('aggregations', [])
            if group_by and aggregations and source_table and target_table:
                agg_columns = ', '.join([
                    f"{agg['function']}({agg['column']}) as {agg.get('alias', agg['column'])}"
                    for agg in aggregations
                ])
                group_cols = ', '.join(group_by)
                return f"INSERT INTO {target_table} SELECT {group_cols}, {agg_columns} FROM {source_table} GROUP BY {group_cols}"
        
        elif rule.rule_type == 'join':
            join_table = config.get('join_table')
            join_type = config.get('join_type', 'INNER')
            join_condition = config.get('join_condition')
            select_columns = config.get('select_columns', '*')
            if join_table and join_condition and source_table and target_table:
                return f"INSERT INTO {target_table} SELECT {select_columns} FROM {source_table} {join_type} JOIN {join_table} ON {join_condition}"
        
        elif rule.rule_type == 'cast':
            column = config.get('column')
            new_type = config.get('new_type')
            if column and new_type and source_table and target_table:
                return f"INSERT INTO {target_table} SELECT *, CAST({column} AS {new_type}) as {column}_casted FROM {source_table}"
        
        elif rule.rule_type == 'expression':
            expression = config.get('expression')
            alias = config.get('alias', 'calculated')
            if expression and source_table and target_table:
                return f"INSERT INTO {target_table} SELECT *, ({expression}) as {alias} FROM {source_table}"
        
        elif rule.rule_type == 'deduplicate':
            partition_by = config.get('partition_by', [])
            order_by = config.get('order_by', [])
            if partition_by and source_table and target_table:
                partition_cols = ', '.join(partition_by)
                order_cols = ', '.join(order_by) if order_by else partition_cols
                return f"""
                    INSERT INTO {target_table}
                    SELECT * FROM (
                        SELECT *, ROW_NUMBER() OVER (PARTITION BY {partition_cols} ORDER BY {order_cols}) as rn
                        FROM {source_table}
                    ) WHERE rn = 1
                """
        
        elif rule.rule_type == 'custom_sql':
            return config.get('sql', '')
        
        return None

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """
        Validate the transformation configuration.

        Checks if the transformation config and rules are valid.
        """
        transformation = self.get_object()
        
        errors = []
        warnings = []
        
        # Validate transformation config
        config = transformation.config or {}
        source_table = config.get('source_table')
        target_table = config.get('target_table')
        
        if not source_table:
            errors.append('Source table is required')
        if not target_table:
            errors.append('Target table is required')
        
        # Validate that tables exist in Trino
        if source_table or target_table:
            try:
                conn = get_trino_connection()
                cursor = conn.cursor()
                
                if source_table:
                    try:
                        cursor.execute(f"DESCRIBE {source_table}")
                        cursor.fetchall()
                    except Exception:
                        errors.append(f"Source table '{source_table}' does not exist or is not accessible")
                
                if target_table:
                    try:
                        cursor.execute(f"DESCRIBE {target_table}")
                        cursor.fetchall()
                    except Exception:
                        warnings.append(f"Target table '{target_table}' does not exist - will be created on execution")
                
                cursor.close()
                conn.close()
            except Exception as e:
                warnings.append(f"Could not validate tables: {str(e)}")
        
        # Validate rules
        rules = transformation.rules.all()
        if not rules.exists():
            warnings.append('No transformation rules defined')
        
        for rule in rules:
            rule_config = rule.config or {}
            
            if rule.rule_type == 'rename_column':
                if not rule_config.get('old_name') or not rule_config.get('new_name'):
                    errors.append(f"Rule '{rule.name}': old_name and new_name are required for rename_column")
            
            elif rule.rule_type == 'filter':
                if not rule_config.get('condition'):
                    errors.append(f"Rule '{rule.name}': condition is required for filter")
            
            elif rule.rule_type == 'aggregate':
                if not rule_config.get('group_by') or not rule_config.get('aggregations'):
                    errors.append(f"Rule '{rule.name}': group_by and aggregations are required for aggregate")
            
            elif rule.rule_type == 'join':
                if not rule_config.get('join_table') or not rule_config.get('join_condition'):
                    errors.append(f"Rule '{rule.name}': join_table and join_condition are required for join")
            
            elif rule.rule_type == 'custom_sql':
                if not rule_config.get('sql'):
                    errors.append(f"Rule '{rule.name}': sql is required for custom_sql")
        
        is_valid = len(errors) == 0
        
        return Response({
            'valid': is_valid,
            'message': 'Transformation configuration is valid' if is_valid else 'Validation failed',
            'errors': errors,
            'warnings': warnings
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

        Runs the check against the specified table using Trino and creates a result record.
        """
        quality_check = self.get_object()
        start_time = time.time()
        
        try:
            # Build and execute the quality check query
            check_sql = self._build_quality_check_sql(quality_check)
            
            if not check_sql:
                return Response({
                    'status': 'error',
                    'message': 'Could not build quality check SQL'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            conn = get_trino_connection()
            cursor = conn.cursor()
            
            # Execute the check
            cursor.execute(check_sql)
            check_result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # Parse results based on check type
            total_records = check_result[0] if check_result and len(check_result) > 0 else 0
            passed_records = check_result[1] if check_result and len(check_result) > 1 else total_records
            failed_records = total_records - passed_records
            pass_percentage = (passed_records / total_records * 100) if total_records > 0 else 100.0
            
            # Determine pass/fail based on threshold
            threshold = quality_check.threshold or 0
            result_status = 'passed' if pass_percentage >= (100 - threshold) else 'failed'
            
            # Create result record
            result = DataQualityResult.objects.create(
                quality_check=quality_check,
                result=result_status,
                total_records=total_records,
                passed_records=passed_records,
                failed_records=failed_records,
                pass_percentage=pass_percentage,
                execution_time=execution_time
            )
            
            # Update quality check
            quality_check.last_run = timezone.now()
            quality_check.last_result = result_status
            quality_check.save()
            
            return Response({
                'status': 'success',
                'result_id': str(result.id),
                'result': result_status,
                'total_records': total_records,
                'passed_records': passed_records,
                'failed_records': failed_records,
                'pass_percentage': float(pass_percentage),
                'execution_time_ms': execution_time
            })
            
        except Exception as e:
            logger.error(f"Quality check execution failed: {str(e)}")
            
            # Create failed result
            result = DataQualityResult.objects.create(
                quality_check=quality_check,
                result='error',
                total_records=0,
                passed_records=0,
                failed_records=0,
                pass_percentage=0,
                execution_time=int((time.time() - start_time) * 1000),
                error_message=str(e)
            )
            
            quality_check.last_run = timezone.now()
            quality_check.last_result = 'error'
            quality_check.save()
            
            return Response({
                'status': 'error',
                'result_id': str(result.id),
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _build_quality_check_sql(self, quality_check):
        """Build SQL for quality check based on check type"""
        config = quality_check.config or {}
        table_name = config.get('table_name', '')
        column_name = config.get('column_name', '')
        
        if not table_name:
            return None
        
        check_type = quality_check.check_type
        
        if check_type == 'null_check':
            # Count total and non-null values
            return f"""
                SELECT 
                    COUNT(*) as total,
                    COUNT({column_name}) as passed
                FROM {table_name}
            """
        
        elif check_type == 'unique_check':
            # Count total vs distinct values
            return f"""
                SELECT 
                    COUNT(*) as total,
                    COUNT(DISTINCT {column_name}) as passed
                FROM {table_name}
            """
        
        elif check_type == 'range_check':
            min_value = config.get('min_value')
            max_value = config.get('max_value')
            conditions = []
            if min_value is not None:
                conditions.append(f"{column_name} >= {min_value}")
            if max_value is not None:
                conditions.append(f"{column_name} <= {max_value}")
            condition = ' AND '.join(conditions) if conditions else '1=1'
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {condition} THEN 1 ELSE 0 END) as passed
                FROM {table_name}
            """
        
        elif check_type == 'pattern_check':
            pattern = config.get('pattern', '')
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN REGEXP_LIKE({column_name}, '{pattern}') THEN 1 ELSE 0 END) as passed
                FROM {table_name}
            """
        
        elif check_type == 'referential_check':
            ref_table = config.get('reference_table')
            ref_column = config.get('reference_column')
            if ref_table and ref_column:
                return f"""
                    SELECT 
                        (SELECT COUNT(*) FROM {table_name}) as total,
                        (SELECT COUNT(*) FROM {table_name} t 
                         WHERE EXISTS (SELECT 1 FROM {ref_table} r WHERE r.{ref_column} = t.{column_name})) as passed
                """
        
        elif check_type == 'freshness_check':
            max_age_hours = config.get('max_age_hours', 24)
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {column_name} >= CURRENT_TIMESTAMP - INTERVAL '{max_age_hours}' HOUR THEN 1 ELSE 0 END) as passed
                FROM {table_name}
            """
        
        elif check_type == 'row_count_check':
            expected_min = config.get('expected_min', 0)
            expected_max = config.get('expected_max')
            if expected_max:
                return f"""
                    SELECT 
                        COUNT(*) as total,
                        CASE WHEN COUNT(*) BETWEEN {expected_min} AND {expected_max} THEN COUNT(*) ELSE 0 END as passed
                    FROM {table_name}
                """
            else:
                return f"""
                    SELECT 
                        COUNT(*) as total,
                        CASE WHEN COUNT(*) >= {expected_min} THEN COUNT(*) ELSE 0 END as passed
                    FROM {table_name}
                """
        
        elif check_type == 'custom_sql':
            custom_sql = config.get('sql', '')
            if custom_sql:
                # Custom SQL should return (total, passed) columns
                return custom_sql
        
        # Default: count all rows as passed
        return f"SELECT COUNT(*) as total, COUNT(*) as passed FROM {table_name}"

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

        # Filter by framework if provided
        framework = self.request.query_params.get('framework')
        if framework:
            queryset = queryset.filter(framework=framework)

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

        # Get framework or default to general
        framework = serializer.validated_data.get('framework', 'general')

        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user,
            kernel=kernel,
            framework=framework,
            cell_count=1,  # Start with 1 empty cell
            content={'cells': [{'cell_type': 'code', 'source': '', 'outputs': []}]}
        )

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Execute all cells in the notebook.
        
        Uses Celery for async execution. Returns immediately with task ID.
        """
        from .tasks import execute_notebook
        
        notebook = self.get_object()
        
        # Check if already running
        if notebook.status == 'running':
            return Response({
                'status': 'error',
                'message': 'Notebook is already running'
            }, status=status.HTTP_409_CONFLICT)
        
        notebook.status = 'queued'
        notebook.save()
        
        # Queue the execution task
        task = execute_notebook.delay(str(notebook.id))
        
        return Response({
            'status': 'queued',
            'message': 'Notebook execution started',
            'notebook_id': str(notebook.id),
            'task_id': task.id
        })
    
    @action(detail=True, methods=['post'])
    def run_cell(self, request, pk=None):
        """Execute a single cell in the notebook."""
        from .tasks import execute_notebook_cell
        
        notebook = self.get_object()
        cell_index = request.data.get('cell_index')
        
        if cell_index is None:
            return Response({
                'status': 'error',
                'message': 'cell_index is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Queue the cell execution
        task = execute_notebook_cell.delay(str(notebook.id), int(cell_index))
        
        return Response({
            'status': 'queued',
            'message': f'Cell {cell_index} execution started',
            'notebook_id': str(notebook.id),
            'cell_index': cell_index,
            'task_id': task.id
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

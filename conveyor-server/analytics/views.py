"""
Views for analytics - dashboards, reports, and data exploration.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.utils.text import slugify
from django.db.models import Count, Q, Avg, Sum
from django.conf import settings
from datetime import timedelta
import uuid
import trino
import time
import logging
import csv
import io
import json

from authentication.permissions import IsWorkspaceMember
from .models import (
    Dashboard,
    Widget,
    SavedQuery,
    Report,
    ReportExecution,
    Exploration,
)
from .serializers import (
    DashboardSerializer,
    DashboardDetailSerializer,
    WidgetSerializer,
    WidgetCreateSerializer,
    SavedQuerySerializer,
    ReportSerializer,
    ReportDetailSerializer,
    ReportExecutionSerializer,
    ExplorationSerializer,
    DashboardSummarySerializer,
    QuerySummarySerializer,
    ReportSummarySerializer,
)

logger = logging.getLogger(__name__)


def get_trino_connection():
    """Create Trino connection for analytics queries"""
    return trino.dbapi.connect(
        host=getattr(settings, 'TRINO_HOST', 'trino'),
        port=getattr(settings, 'TRINO_PORT', 8080),
        user='trino',
        catalog='iceberg',  # Trino still uses catalog terminology internally
        http_scheme='http',
    )


def execute_trino_query(query_text, limit=1000):
    """Execute a Trino query and return results"""
    start_time = time.time()
    
    conn = get_trino_connection()
    cursor = conn.cursor()
    
    # Clean query and add limit if needed
    clean_query = query_text.rstrip(';').strip()
    if limit and 'LIMIT' not in clean_query.upper():
        clean_query = f"{clean_query} LIMIT {limit}"
    
    cursor.execute(clean_query)
    
    columns = [desc[0] for desc in cursor.description] if cursor.description else []
    rows = cursor.fetchall()
    
    execution_time_ms = int((time.time() - start_time) * 1000)
    
    cursor.close()
    conn.close()
    
    return {
        'columns': columns,
        'rows': rows,
        'row_count': len(rows),
        'execution_time_ms': execution_time_ms,
    }


class DashboardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analytics dashboards.
    """
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Dashboard.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(workspace_id=workspace_id) |
                Q(is_public=True)
            )
        
        # Filter by owner
        owner = self.request.query_params.get('owner')
        if owner == 'me':
            queryset = queryset.filter(owner=self.request.user)
        elif owner:
            queryset = queryset.filter(owner_id=owner)
        
        # Filter by public
        is_public = self.request.query_params.get('public')
        if is_public:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')
        
        # Filter by template
        is_template = self.request.query_params.get('template')
        if is_template:
            queryset = queryset.filter(is_template=is_template.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DashboardDetailSerializer
        return DashboardSerializer
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        name = serializer.validated_data.get('name')
        slug = slugify(name)
        
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while Dashboard.objects.filter(workspace_id=workspace_id, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user,
            created_by=self.request.user,
            slug=slug,
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Override to track view count."""
        instance = self.get_object()
        instance.view_count += 1
        instance.last_viewed_at = timezone.now()
        instance.save(update_fields=['view_count', 'last_viewed_at'])
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a dashboard."""
        dashboard = self.get_object()
        workspace_id = request.headers.get('X-Workspace-ID')
        
        # Create new dashboard
        new_dashboard = Dashboard.objects.create(
            workspace_id=workspace_id,
            name=f"{dashboard.name} (Copy)",
            description=dashboard.description,
            slug=f"{dashboard.slug}-{int(timezone.now().timestamp())}",
            layout=dashboard.layout,
            theme=dashboard.theme,
            auto_refresh=dashboard.auto_refresh,
            refresh_interval_seconds=dashboard.refresh_interval_seconds,
            owner=request.user,
            created_by=request.user,
        )
        
        # Copy widgets
        for widget in dashboard.widgets.all():
            Widget.objects.create(
                dashboard=new_dashboard,
                name=widget.name,
                widget_type=widget.widget_type,
                query_id=widget.query_id,
                query_text=widget.query_text,
                data_source=widget.data_source,
                config=widget.config,
                position_x=widget.position_x,
                position_y=widget.position_y,
                width=widget.width,
                height=widget.height,
                cache_duration_seconds=widget.cache_duration_seconds,
            )
        
        serializer = DashboardDetailSerializer(new_dashboard)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_widget(self, request, pk=None):
        """Add a widget to the dashboard."""
        dashboard = self.get_object()
        
        serializer = WidgetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        widget = serializer.save(dashboard=dashboard)
        
        return Response(WidgetSerializer(widget).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        dashboards = Dashboard.objects.all()
        widgets = Widget.objects.all()
        
        if workspace_id:
            dashboards = dashboards.filter(workspace_id=workspace_id)
            widgets = widgets.filter(dashboard__workspace_id=workspace_id)
        
        # Most viewed dashboards
        most_viewed = DashboardSerializer(
            dashboards.order_by('-view_count')[:5], many=True
        ).data
        
        data = {
            'total_dashboards': dashboards.count(),
            'public_dashboards': dashboards.filter(is_public=True).count(),
            'template_dashboards': dashboards.filter(is_template=True).count(),
            'total_widgets': widgets.count(),
            'most_viewed': most_viewed,
        }
        
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)


class WidgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for dashboard widgets.
    """
    serializer_class = WidgetSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Widget.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(dashboard__workspace_id=workspace_id)
        
        # Filter by dashboard
        dashboard_id = self.request.query_params.get('dashboard')
        if dashboard_id:
            queryset = queryset.filter(dashboard_id=dashboard_id)
        
        return queryset.order_by('dashboard', 'position_y', 'position_x')
    
    @action(detail=True, methods=['post'])
    def refresh(self, request, pk=None):
        """Refresh widget data."""
        widget = self.get_object()
        
        # Execute query and cache results
        try:
            data = self._execute_widget_query(widget)
            widget.cached_data = data
            widget.last_cached_at = timezone.now()
            widget.save()
            
            return Response({
                'data': data,
                'cached_at': widget.last_cached_at,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _execute_widget_query(self, widget):
        """Execute widget query against Trino"""
        query_text = widget.query_text
        
        # If widget uses a saved query, get that instead
        if widget.query_id:
            try:
                saved_query = SavedQuery.objects.get(id=widget.query_id)
                query_text = saved_query.query_text
            except SavedQuery.DoesNotExist:
                pass
        
        if not query_text:
            return {
                'columns': [],
                'rows': [],
                'error': 'No query defined for widget'
            }
        
        try:
            result = execute_trino_query(query_text, limit=widget.config.get('max_rows', 1000))
            return {
                'columns': result['columns'],
                'rows': result['rows'],
                'row_count': result['row_count'],
                'execution_time_ms': result['execution_time_ms'],
            }
        except Exception as e:
            logger.error(f"Widget query execution failed: {str(e)}")
            return {
                'columns': [],
                'rows': [],
                'error': str(e)
            }


class SavedQueryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for saved queries.
    """
    serializer_class = SavedQuerySerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = SavedQuery.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(workspace_id=workspace_id) |
                Q(is_public=True)
            )
        
        # Filter by owner
        owner = self.request.query_params.get('owner')
        if owner == 'me':
            queryset = queryset.filter(owner=self.request.user)
        elif owner:
            queryset = queryset.filter(owner_id=owner)
        
        # Filter by folder
        folder = self.request.query_params.get('folder')
        if folder:
            queryset = queryset.filter(folder=folder)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(query_text__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user,
        )
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute the saved query."""
        query = self.get_object()
        
        # Get parameters
        params = request.data.get('parameters', {})
        
        # Execute query
        try:
            result = self._execute_query(query, params)
            
            # Update statistics
            query.execution_count += 1
            query.last_executed_at = timezone.now()
            query.save()
            
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _execute_query(self, query, params):
        """Execute query against Trino with parameter substitution"""
        query_text = query.query_text
        
        # Simple parameter substitution (replace {{param}} with value)
        for param_name, param_value in params.items():
            placeholder = f"{{{{{param_name}}}}}"
            # Escape string values for SQL
            if isinstance(param_value, str):
                safe_value = param_value.replace("'", "''")
                query_text = query_text.replace(placeholder, f"'{safe_value}'")
            else:
                query_text = query_text.replace(placeholder, str(param_value))
        
        try:
            result = execute_trino_query(query_text, limit=10000)
            
            # Update query statistics
            if query.avg_execution_time_ms:
                query.avg_execution_time_ms = (query.avg_execution_time_ms + result['execution_time_ms']) / 2
            else:
                query.avg_execution_time_ms = result['execution_time_ms']
            query.save()
            
            return result
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            raise
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a saved query."""
        query = self.get_object()
        workspace_id = request.headers.get('X-Workspace-ID')
        
        new_query = SavedQuery.objects.create(
            workspace_id=workspace_id,
            name=f"{query.name} (Copy)",
            description=query.description,
            query_text=query.query_text,
            namespace=query.namespace,
            schema_name=query.schema_name,
            parameters=query.parameters,
            tags=query.tags,
            folder=query.folder,
            owner=request.user,
        )
        
        serializer = self.get_serializer(new_query)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def folders(self, request):
        """Get list of query folders."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = SavedQuery.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        folders = queryset.values_list('folder', flat=True).distinct()
        return Response(list(filter(None, folders)))
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get query summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = SavedQuery.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        avg_time = queryset.aggregate(avg=Avg('avg_execution_time_ms'))['avg'] or 0
        
        data = {
            'total_queries': queryset.count(),
            'public_queries': queryset.filter(is_public=True).count(),
            'total_executions': queryset.aggregate(total=Sum('execution_count'))['total'] or 0,
            'avg_execution_time_ms': avg_time,
        }
        
        serializer = QuerySummarySerializer(data)
        return Response(serializer.data)


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for scheduled reports.
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Report.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by enabled
        enabled = self.request.query_params.get('enabled')
        if enabled:
            queryset = queryset.filter(enabled=enabled.lower() == 'true')
        
        # Filter by format
        format_filter = self.request.query_params.get('format')
        if format_filter:
            queryset = queryset.filter(format=format_filter)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ReportDetailSerializer
        return ReportSerializer
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user,
        )
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Manually run a report."""
        report = self.get_object()
        
        # Create execution record
        execution = ReportExecution.objects.create(
            report=report,
            status='running',
            started_at=timezone.now(),
        )
        
        # Generate report (placeholder)
        try:
            result = self._generate_report(report)
            
            execution.status = 'completed'
            execution.completed_at = timezone.now()
            execution.duration_ms = int(
                (execution.completed_at - execution.started_at).total_seconds() * 1000
            )
            execution.file_url = result.get('url', '')
            execution.file_size_bytes = result.get('size', 0)
            execution.save()
            
            report.last_generated_at = timezone.now()
            report.save()
            
            return Response(ReportExecutionSerializer(execution).data)
        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.completed_at = timezone.now()
            execution.save()
            
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _generate_report(self, report):
        """Generate report in the specified format (CSV, PDF, or JSON)"""
        from data_lake.storage import storage
        import tempfile
        import os
        
        # Execute the report query
        query_text = report.query_text
        if not query_text and report.dashboard_id:
            # Aggregate data from dashboard widgets
            query_text = self._get_dashboard_query(report.dashboard_id)
        
        if not query_text:
            raise ValueError("No query defined for report")
        
        try:
            result = execute_trino_query(query_text, limit=report.max_rows or 100000)
            columns = result['columns']
            rows = result['rows']
        except Exception as e:
            raise ValueError(f"Failed to execute report query: {str(e)}")
        
        report_format = report.format or 'csv'
        workspace_id = str(report.workspace_id)
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"report_{report.id}_{timestamp}.{report_format}"
        
        try:
            if report_format == 'csv':
                # Generate CSV
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(columns)
                writer.writerows(rows)
                content = output.getvalue().encode('utf-8')
                content_type = 'text/csv'
                
            elif report_format == 'json':
                # Generate JSON
                data = [dict(zip(columns, row)) for row in rows]
                content = json.dumps({'data': data, 'columns': columns}, indent=2, default=str).encode('utf-8')
                content_type = 'application/json'
                
            elif report_format == 'pdf':
                # Generate PDF using simple HTML to PDF conversion
                try:
                    from weasyprint import HTML
                    
                    # Build HTML table
                    html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; margin: 20px; }}
                            h1 {{ color: #333; }}
                            table {{ border-collapse: collapse; width: 100%; }}
                            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                            th {{ background-color: #4CAF50; color: white; }}
                            tr:nth-child(even) {{ background-color: #f2f2f2; }}
                        </style>
                    </head>
                    <body>
                        <h1>{report.name}</h1>
                        <p>Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <table>
                            <tr>{"".join(f"<th>{col}</th>" for col in columns)}</tr>
                            {"".join(f"<tr>{''.join(f'<td>{cell}</td>' for cell in row)}</tr>" for row in rows[:1000])}
                        </table>
                        <p>Total rows: {len(rows)}</p>
                    </body>
                    </html>
                    """
                    
                    pdf_bytes = HTML(string=html_content).write_pdf()
                    content = pdf_bytes
                    content_type = 'application/pdf'
                except ImportError:
                    # Fallback to CSV if weasyprint not available
                    logger.warning("weasyprint not available, falling back to CSV")
                    output = io.StringIO()
                    writer = csv.writer(output)
                    writer.writerow(columns)
                    writer.writerows(rows)
                    content = output.getvalue().encode('utf-8')
                    content_type = 'text/csv'
                    filename = filename.replace('.pdf', '.csv')
            else:
                raise ValueError(f"Unsupported report format: {report_format}")
            
            # Upload to MinIO storage
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{report_format}') as tmp_file:
                tmp_file.write(content)
                tmp_file.flush()
                
                storage_url = storage.upload_file(
                    file_obj=open(tmp_file.name, 'rb'),
                    object_name=f"reports/{filename}",
                    workspace_id=workspace_id,
                    metadata={
                        'report_id': str(report.id),
                        'format': report_format,
                        'content_type': content_type
                    }
                )
                
                os.unlink(tmp_file.name)
            
            # Generate download URL
            download_url = storage.get_presigned_url(
                object_name=f"reports/{filename}",
                workspace_id=workspace_id,
                expiration=86400,  # 24 hours
                http_method='get_object'
            )
            
            return {
                'url': download_url,
                'filename': filename,
                'size': len(content),
                'format': report_format,
                'row_count': len(rows),
            }
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            raise

    def _get_dashboard_query(self, dashboard_id):
        """Build aggregate query from dashboard widgets"""
        try:
            dashboard = Dashboard.objects.get(id=dashboard_id)
            queries = []
            for widget in dashboard.widgets.all():
                if widget.query_text:
                    queries.append(widget.query_text)
            if queries:
                return queries[0]  # Use first widget's query
        except Dashboard.DoesNotExist:
            pass
        return None
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle report enabled status."""
        report = self.get_object()
        report.enabled = not report.enabled
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get report summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = Report.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # By format
        format_counts = {}
        for report in queryset:
            format_counts[report.format] = format_counts.get(report.format, 0) + 1
        
        # By delivery
        delivery_counts = {}
        for report in queryset:
            delivery_counts[report.delivery_method] = delivery_counts.get(report.delivery_method, 0) + 1
        
        data = {
            'total_reports': queryset.count(),
            'enabled_reports': queryset.filter(enabled=True).count(),
            'reports_by_format': format_counts,
            'reports_by_delivery': delivery_counts,
        }
        
        serializer = ReportSummarySerializer(data)
        return Response(serializer.data)


class ReportExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for report executions (read-only).
    """
    serializer_class = ReportExecutionSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = ReportExecution.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(report__workspace_id=workspace_id)
        
        # Filter by report
        report_id = self.request.query_params.get('report')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class ExplorationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data explorations.
    """
    serializer_class = ExplorationSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Exploration.objects.filter(user=self.request.user)
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            user=self.request.user,
        )
    
    @action(detail=True, methods=['post'])
    def execute_cell(self, request, pk=None):
        """Execute a cell in the exploration."""
        exploration = self.get_object()
        
        cell_index = request.data.get('cell_index', 0)
        code = request.data.get('code', '')
        
        # Execute code (placeholder)
        try:
            result = self._execute_code(code)
            
            # Update state
            state = exploration.state or {'cells': []}
            if cell_index < len(state.get('cells', [])):
                state['cells'][cell_index]['result'] = result
            else:
                state['cells'].append({
                    'code': code,
                    'result': result,
                })
            
            exploration.state = state
            exploration.cell_count = len(state['cells'])
            exploration.last_cell_executed_at = timezone.now()
            exploration.save()
            
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _execute_code(self, code):
        """Execute code - supports SQL queries and Python expressions"""
        code = code.strip()
        
        # Check if it's a SQL query (starts with common SQL keywords)
        sql_keywords = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER']
        is_sql = any(code.upper().startswith(keyword) for keyword in sql_keywords)
        
        if is_sql:
            # Execute as Trino SQL
            try:
                result = execute_trino_query(code, limit=1000)
                return {
                    'type': 'table',
                    'columns': result['columns'],
                    'rows': result['rows'],
                    'row_count': result['row_count'],
                    'execution_time_ms': result['execution_time_ms'],
                }
            except Exception as e:
                return {
                    'type': 'error',
                    'error': str(e),
                }
        else:
            # Execute as Python expression in a restricted environment
            try:
                # Safe built-ins for exploration
                safe_builtins = {
                    'abs': abs, 'all': all, 'any': any, 'bool': bool,
                    'dict': dict, 'enumerate': enumerate, 'filter': filter,
                    'float': float, 'int': int, 'len': len, 'list': list,
                    'map': map, 'max': max, 'min': min, 'pow': pow,
                    'range': range, 'round': round, 'set': set, 'sorted': sorted,
                    'str': str, 'sum': sum, 'tuple': tuple, 'zip': zip,
                    'True': True, 'False': False, 'None': None,
                }
                
                # Try to evaluate as expression
                result = eval(code, {"__builtins__": safe_builtins}, {})
                
                # Format result based on type
                if isinstance(result, (list, tuple)):
                    if result and isinstance(result[0], (list, tuple, dict)):
                        # Table-like data
                        if isinstance(result[0], dict):
                            columns = list(result[0].keys())
                            rows = [list(r.values()) for r in result]
                        else:
                            columns = [f'col_{i}' for i in range(len(result[0]))]
                            rows = result
                        return {
                            'type': 'table',
                            'columns': columns,
                            'rows': rows,
                        }
                    else:
                        return {
                            'type': 'list',
                            'data': list(result),
                        }
                elif isinstance(result, dict):
                    return {
                        'type': 'json',
                        'data': result,
                    }
                else:
                    return {
                        'type': 'text',
                        'data': str(result),
                    }
            except SyntaxError:
                # Try to exec as statements
                try:
                    local_vars = {}
                    exec(code, {"__builtins__": safe_builtins}, local_vars)
                    if local_vars:
                        return {
                            'type': 'json',
                            'data': {k: str(v) for k, v in local_vars.items()},
                        }
                    return {
                        'type': 'text',
                        'data': 'Executed successfully',
                    }
                except Exception as e:
                    return {
                        'type': 'error',
                        'error': str(e),
                    }
            except Exception as e:
                return {
                    'type': 'error',
                    'error': str(e),
                }

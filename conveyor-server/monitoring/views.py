"""
Views for monitoring - system health, alerts, and audit logging.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from django.core.cache import cache
import psutil
from datetime import timedelta

from authentication.permissions import IsWorkspaceMember
from .models import SystemHealth, Alert, AuditLog, MetricSnapshot
from .serializers import (
    SystemHealthSerializer,
    AlertSerializer,
    AlertUpdateSerializer,
    AuditLogSerializer,
    MetricSnapshotSerializer,
    SystemOverviewSerializer,
)


class SystemHealthViewSet(viewsets.ModelViewSet):
    """
    ViewSet for system health monitoring.
    """
    serializer_class = SystemHealthSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']
    
    def get_queryset(self):
        return SystemHealth.objects.all()
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current health status of all services."""
        services = ['api', 'celery', 'database', 'redis', 'minio', 'trino', 'hive_metastore']
        health_data = []
        
        for service in services:
            health = self._check_service_health(service)
            health_data.append(health)
            
            # Store in database
            SystemHealth.objects.create(**health)
        
        return Response(health_data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get health history for a service."""
        service = request.query_params.get('service', 'api')
        hours = int(request.query_params.get('hours', 24))
        
        since = timezone.now() - timedelta(hours=hours)
        health_records = SystemHealth.objects.filter(
            service=service,
            checked_at__gte=since
        ).order_by('-checked_at')[:100]
        
        serializer = self.get_serializer(health_records, many=True)
        return Response(serializer.data)
    
    def _check_service_health(self, service):
        """Check health of a specific service."""
        import requests
        import redis as redis_lib
        import socket
        from django.conf import settings
        
        health = {
            'service': service,
            'status': 'unknown',
            'response_time_ms': None,
            'cpu_usage': None,
            'memory_usage': None,
            'disk_usage': None,
            'details': {},
            'error_message': None,
        }
        
        try:
            start_time = timezone.now()
            
            if service == 'api':
                # API is healthy if we're here
                health['status'] = 'healthy'
                health['cpu_usage'] = psutil.cpu_percent()
                health['memory_usage'] = psutil.virtual_memory().percent
                health['disk_usage'] = psutil.disk_usage('/').percent
                
            elif service == 'database':
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute('SELECT 1')
                health['status'] = 'healthy'
                
            elif service == 'redis':
                r = redis_lib.Redis(
                    host=getattr(settings, 'REDIS_HOST', 'localhost'),
                    port=getattr(settings, 'REDIS_PORT', 6379),
                    socket_timeout=5
                )
                r.ping()
                health['status'] = 'healthy'
                info = r.info()
                health['details'] = {
                    'connected_clients': info.get('connected_clients'),
                    'used_memory_human': info.get('used_memory_human'),
                }
                
            elif service == 'minio':
                endpoint = getattr(settings, 'AWS_S3_ENDPOINT_URL', 'http://localhost:9000')
                response = requests.get(f"{endpoint}/minio/health/live", timeout=5)
                health['status'] = 'healthy' if response.status_code == 200 else 'unhealthy'
                
            elif service == 'trino':
                trino_url = getattr(settings, 'TRINO_HOST', 'http://localhost:8090')
                response = requests.get(f"{trino_url}/v1/info", timeout=5)
                if response.status_code == 200:
                    health['status'] = 'healthy'
                    health['details'] = response.json()
                else:
                    health['status'] = 'unhealthy'
                    
            elif service == 'hive_metastore':
                # Check if Hive Metastore is reachable
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex(('hive-metastore', 9083))
                sock.close()
                health['status'] = 'healthy' if result == 0 else 'unhealthy'
                
            elif service == 'celery':
                from conveyor_server.celery import app
                inspect = app.control.inspect()
                stats = inspect.stats()
                if stats:
                    health['status'] = 'healthy'
                    health['details'] = {'workers': list(stats.keys())}
                else:
                    health['status'] = 'unhealthy'
                    health['error_message'] = 'No workers available'
            
            end_time = timezone.now()
            health['response_time_ms'] = int((end_time - start_time).total_seconds() * 1000)
            
        except Exception as e:
            health['status'] = 'unhealthy'
            health['error_message'] = str(e)
        
        return health


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for system alerts.
    """
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Alert.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(workspace_id=workspace_id) | Q(workspace__isnull=True)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by type
        alert_type = self.request.query_params.get('type')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action in ['acknowledge', 'resolve', 'dismiss']:
            return AlertUpdateSerializer
        return AlertSerializer
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert."""
        alert = self.get_object()
        alert.status = 'acknowledged'
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        
        serializer = AlertSerializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark an alert as resolved."""
        alert = self.get_object()
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()
        
        serializer = AlertSerializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an alert."""
        alert = self.get_object()
        alert.status = 'dismissed'
        alert.save()
        
        serializer = AlertSerializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get alert summary by severity and status."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = Alert.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(workspace_id=workspace_id) | Q(workspace__isnull=True)
            )
        
        summary = {
            'total': queryset.count(),
            'active': queryset.filter(status='active').count(),
            'by_severity': {
                'critical': queryset.filter(severity='critical', status='active').count(),
                'error': queryset.filter(severity='error', status='active').count(),
                'warning': queryset.filter(severity='warning', status='active').count(),
                'info': queryset.filter(severity='info', status='active').count(),
            },
            'by_type': list(
                queryset.filter(status='active')
                .values('alert_type')
                .annotate(count=Count('id'))
            ),
        }
        
        return Response(summary)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for audit logs (read-only).
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = AuditLog.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action_filter = self.request.query_params.get('action')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get audit log summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = AuditLog.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Last 24 hours
        since = timezone.now() - timedelta(hours=24)
        recent = queryset.filter(created_at__gte=since)
        
        summary = {
            'total_actions_24h': recent.count(),
            'by_action': list(
                recent.values('action').annotate(count=Count('id'))
            ),
            'by_resource': list(
                recent.values('resource_type').annotate(count=Count('id'))
            ),
            'by_user': list(
                recent.values('user__email').annotate(count=Count('id'))[:10]
            ),
        }
        
        return Response(summary)


class MetricSnapshotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for metric snapshots.
    """
    serializer_class = MetricSnapshotSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = MetricSnapshot.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(workspace_id=workspace_id) | Q(workspace__isnull=True)
            )
        
        # Filter by metric type
        metric_type = self.request.query_params.get('metric_type')
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        # Filter by period
        period = self.request.query_params.get('period')
        if period:
            queryset = queryset.filter(period=period)
        
        return queryset.order_by('-period_start')
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get system metrics overview."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        # Get counts from various sources
        from integration.models import Pipeline, Source, PipelineRun
        from warehouse.models import QueryHistory
        
        pipeline_qs = Pipeline.objects.all()
        source_qs = Source.objects.all()
        
        if workspace_id:
            pipeline_qs = pipeline_qs.filter(workspace_id=workspace_id)
            source_qs = source_qs.filter(workspace_id=workspace_id)
        
        # Calculate metrics
        today = timezone.now().date()
        queries_today = QueryHistory.objects.filter(
            completed_at__date=today
        ).count() if workspace_id else 0
        
        overview = {
            'total_pipelines': pipeline_qs.count(),
            'running_pipelines': pipeline_qs.filter(status='running').count(),
            'failed_pipelines': pipeline_qs.filter(status='error').count(),
            'total_sources': source_qs.count(),
            'active_sources': source_qs.filter(status='active').count(),
            'queries_today': queries_today,
            'storage_used_bytes': 0,  # Would come from MinIO stats
            'records_processed': PipelineRun.objects.filter(
                pipeline__workspace_id=workspace_id
            ).aggregate(
                total=Count('id')
            )['total'] or 0,
        }
        
        serializer = SystemOverviewSerializer(overview)
        return Response(serializer.data)


class GlobalSearchView(viewsets.ViewSet):
    """
    Global search across all resources in the workspace.
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        Search across multiple resource types.
        Query params:
            - q: search query (required)
            - types: comma-separated list of resource types to search (optional)
            - limit: max results per type (default 10)
        """
        query = request.query_params.get('q', '').strip()
        types_param = request.query_params.get('types', '')
        limit = int(request.query_params.get('limit', 10))
        workspace_id = request.headers.get('X-Workspace-ID')
        
        if not query:
            return Response({
                'error': 'Search query is required',
                'results': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Define searchable types
        all_types = ['pipelines', 'sources', 'transformations', 'queries', 'dashboards', 
                     'models', 'files', 'streams', 'assets', 'glossary']
        
        # Filter to requested types
        if types_param:
            search_types = [t.strip() for t in types_param.split(',') if t.strip() in all_types]
        else:
            search_types = all_types
        
        results = []
        
        # Search each resource type
        for resource_type in search_types:
            type_results = self._search_resource_type(query, resource_type, workspace_id, limit)
            results.extend(type_results)
        
        # Sort by relevance (name match > description match)
        results.sort(key=lambda x: (
            -x.get('relevance_score', 0),
            x.get('name', '').lower()
        ))
        
        return Response({
            'query': query,
            'total_results': len(results),
            'results': results
        })
    
    def _search_resource_type(self, query, resource_type, workspace_id, limit):
        """Search within a specific resource type."""
        results = []
        query_lower = query.lower()
        
        try:
            if resource_type == 'pipelines':
                from integration.models import Pipeline
                qs = Pipeline.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'pipeline',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/pipelines/{item.id}',
                        'status': item.status,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'sources':
                from integration.models import Source
                qs = Source.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'source',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/sources/{item.id}',
                        'connector_type': item.connector_type,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'transformations':
                from transformation.models import Transformation
                qs = Transformation.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'transformation',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/transformations/{item.id}',
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'queries':
                from analytics.models import SavedQuery
                qs = SavedQuery.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query) | Q(sql__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'query',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/analytics/queries/{item.id}',
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'dashboards':
                from analytics.models import Dashboard
                qs = Dashboard.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'dashboard',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/analytics/dashboards/{item.id}',
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'models':
                from data_science.models import MLModel
                qs = MLModel.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'model',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/data-science/models/{item.id}',
                        'model_type': item.model_type,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'files':
                from data_lake.models import DataFile
                qs = DataFile.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query) | Q(path__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'file',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/data-lake/files/{item.id}',
                        'file_type': item.file_type,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'streams':
                from streaming.models import Stream
                qs = Stream.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'stream',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/streaming/{item.id}',
                        'stream_type': item.stream_type,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'assets':
                from governance.models import DataAsset
                qs = DataAsset.objects.filter(
                    Q(name__icontains=query) | Q(description__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'asset',
                        'name': item.name,
                        'description': item.description or '',
                        'url': f'/governance/assets/{item.id}',
                        'asset_type': item.asset_type,
                        'relevance_score': self._calculate_relevance(query_lower, item.name, item.description),
                    })
            
            elif resource_type == 'glossary':
                from governance.models import BusinessGlossary
                qs = BusinessGlossary.objects.filter(
                    Q(term__icontains=query) | Q(definition__icontains=query) | Q(synonyms__icontains=query)
                )
                if workspace_id:
                    qs = qs.filter(workspace_id=workspace_id)
                
                for item in qs[:limit]:
                    results.append({
                        'id': str(item.id),
                        'type': 'glossary',
                        'name': item.term,
                        'description': item.definition or '',
                        'url': f'/governance/glossary/{item.id}',
                        'relevance_score': self._calculate_relevance(query_lower, item.term, item.definition),
                    })
        
        except Exception as e:
            # Log error but don't fail the entire search
            import logging
            logging.getLogger(__name__).warning(f"Search error for {resource_type}: {str(e)}")
        
        return results
    
    def _calculate_relevance(self, query, name, description):
        """Calculate relevance score for search result."""
        score = 0
        name_lower = (name or '').lower()
        desc_lower = (description or '').lower()
        
        # Exact name match
        if name_lower == query:
            score += 100
        # Name starts with query
        elif name_lower.startswith(query):
            score += 80
        # Query in name
        elif query in name_lower:
            score += 60
        
        # Query in description
        if query in desc_lower:
            score += 20
        
        return score

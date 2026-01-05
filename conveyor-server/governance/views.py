"""
Views for data governance - catalog, lineage, quality rules, and policies.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.conf import settings
from datetime import timedelta
import trino
import time
import logging

from authentication.permissions import IsWorkspaceMember
from .models import (
    DataAsset,
    DataLineage,
    DataQualityRule,
    DataQualityResult,
    GlossaryTerm,
    Policy,
)
from .serializers import (
    DataAssetSerializer,
    DataLineageSerializer,
    DataQualityRuleSerializer,
    DataQualityResultSerializer,
    GlossaryTermSerializer,
    PolicySerializer,
    LineageGraphSerializer,
    DataQualitySummarySerializer,
)

logger = logging.getLogger(__name__)


def get_trino_connection():
    """Create Trino connection for quality rule execution"""
    return trino.dbapi.connect(
        host=getattr(settings, 'TRINO_HOST', 'trino'),
        port=getattr(settings, 'TRINO_PORT', 8080),
        user='trino',
        catalog='iceberg',
        http_scheme='http',
    )


class DataAssetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data asset catalog.
    """
    serializer_class = DataAssetSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = DataAsset.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by asset type
        asset_type = self.request.query_params.get('type')
        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)
        
        # Filter by certified status
        certified = self.request.query_params.get('certified')
        if certified:
            queryset = queryset.filter(is_certified=certified.lower() == 'true')
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by tags
        tags = self.request.query_params.get('tags')
        if tags:
            for tag in tags.split(','):
                queryset = queryset.filter(tags__icontains=tag.strip())
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def certify(self, request, pk=None):
        """Mark a data asset as certified."""
        asset = self.get_object()
        asset.is_certified = True
        asset.certified_by = request.user
        asset.certified_at = timezone.now()
        asset.save()
        
        serializer = self.get_serializer(asset)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def uncertify(self, request, pk=None):
        """Remove certification from a data asset."""
        asset = self.get_object()
        asset.is_certified = False
        asset.certified_by = None
        asset.certified_at = None
        asset.save()
        
        serializer = self.get_serializer(asset)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get catalog summary statistics."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = DataAsset.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        summary = {
            'total_assets': queryset.count(),
            'certified_assets': queryset.filter(is_certified=True).count(),
            'by_type': list(
                queryset.values('asset_type').annotate(count=Count('id'))
            ),
            'recent_updates': DataAssetSerializer(
                queryset.order_by('-updated_at')[:5], many=True
            ).data,
        }
        
        return Response(summary)


class DataLineageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data lineage tracking.
    """
    serializer_class = DataLineageSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = DataLineage.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(
                Q(source_asset__workspace_id=workspace_id) |
                Q(target_asset__workspace_id=workspace_id)
            )
        
        # Filter by source or target asset
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            queryset = queryset.filter(
                Q(source_asset_id=asset_id) | Q(target_asset_id=asset_id)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def graph(self, request):
        """Get lineage graph for visualization."""
        workspace_id = request.headers.get('X-Workspace-ID')
        asset_id = request.query_params.get('asset')
        depth = int(request.query_params.get('depth', 3))
        
        nodes = {}
        edges = []
        
        # Build graph from lineage relationships
        queryset = DataLineage.objects.all()
        if workspace_id:
            queryset = queryset.filter(
                Q(source_asset__workspace_id=workspace_id) |
                Q(target_asset__workspace_id=workspace_id)
            )
        
        def add_node(asset):
            if asset.id not in nodes:
                nodes[asset.id] = {
                    'id': str(asset.id),
                    'label': asset.name,
                    'type': asset.asset_type,
                    'certified': asset.is_certified,
                }
        
        # If specific asset, get upstream and downstream
        if asset_id:
            # Get upstream (sources that lead to this asset)
            upstream = self._get_upstream(asset_id, queryset, depth)
            # Get downstream (assets that depend on this)
            downstream = self._get_downstream(asset_id, queryset, depth)
            
            lineage_records = list(upstream) + list(downstream)
        else:
            lineage_records = queryset[:100]
        
        for lineage in lineage_records:
            add_node(lineage.source_asset)
            add_node(lineage.target_asset)
            edges.append({
                'id': str(lineage.id),
                'source': str(lineage.source_asset_id),
                'target': str(lineage.target_asset_id),
                'type': lineage.transformation_type,
            })
        
        data = {
            'nodes': list(nodes.values()),
            'edges': edges,
        }
        
        serializer = LineageGraphSerializer(data)
        return Response(serializer.data)
    
    def _get_upstream(self, asset_id, queryset, depth, visited=None):
        """Recursively get upstream lineage."""
        if visited is None:
            visited = set()
        if depth <= 0 or asset_id in visited:
            return []
        
        visited.add(asset_id)
        upstream = queryset.filter(target_asset_id=asset_id)
        result = list(upstream)
        
        for lineage in upstream:
            result.extend(
                self._get_upstream(
                    lineage.source_asset_id, queryset, depth - 1, visited
                )
            )
        
        return result
    
    def _get_downstream(self, asset_id, queryset, depth, visited=None):
        """Recursively get downstream lineage."""
        if visited is None:
            visited = set()
        if depth <= 0 or asset_id in visited:
            return []
        
        visited.add(asset_id)
        downstream = queryset.filter(source_asset_id=asset_id)
        result = list(downstream)
        
        for lineage in downstream:
            result.extend(
                self._get_downstream(
                    lineage.target_asset_id, queryset, depth - 1, visited
                )
            )
        
        return result


class DataQualityRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data quality rules.
    """
    serializer_class = DataQualityRuleSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = DataQualityRule.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by asset
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            queryset = queryset.filter(data_asset_id=asset_id)
        
        # Filter by rule type
        rule_type = self.request.query_params.get('type')
        if rule_type:
            queryset = queryset.filter(rule_type=rule_type)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by active status
        active = self.request.query_params.get('active')
        if active:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Execute a quality rule and get results."""
        rule = self.get_object()
        
        # Execute the rule (placeholder - actual implementation depends on rule type)
        result = self._execute_rule(rule)
        
        # Store result
        quality_result = DataQualityResult.objects.create(
            rule=rule,
            **result
        )
        
        serializer = DataQualityResultSerializer(quality_result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle rule active status."""
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        
        serializer = self.get_serializer(rule)
        return Response(serializer.data)
    
    def _execute_rule(self, rule):
        """Execute a quality rule using Trino SQL"""
        start_time = time.time()
        
        # Get rule configuration
        rule_type = rule.rule_type
        config = rule.config or {}
        
        # Build and execute the query
        try:
            sql = self._build_rule_sql(rule)
            
            if not sql:
                return {
                    'passed': False,
                    'actual_value': 'N/A',
                    'expected_value': 'N/A',
                    'records_checked': 0,
                    'records_failed': 0,
                    'failure_percentage': 0,
                    'execution_time_ms': 0,
                    'error_message': 'Could not build quality rule SQL'
                }
            
            conn = get_trino_connection()
            cursor = conn.cursor()
            cursor.execute(sql)
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # Parse result based on rule type
            total_records = result[0] if result and len(result) > 0 else 0
            passed_records = result[1] if result and len(result) > 1 else total_records
            actual_value = result[2] if result and len(result) > 2 else str(passed_records)
            
            failed_records = total_records - passed_records
            failure_percentage = (failed_records / total_records * 100) if total_records > 0 else 0
            
            # Check against threshold
            threshold = rule.threshold or 0
            passed = failure_percentage <= threshold
            
            return {
                'passed': passed,
                'actual_value': str(actual_value),
                'expected_value': f'failure rate <= {threshold}%',
                'records_checked': total_records,
                'records_failed': failed_records,
                'failure_percentage': failure_percentage,
                'execution_time_ms': execution_time,
            }
            
        except Exception as e:
            logger.error(f"Quality rule execution failed: {str(e)}")
            return {
                'passed': False,
                'actual_value': 'Error',
                'expected_value': 'N/A',
                'records_checked': 0,
                'records_failed': 0,
                'failure_percentage': 100,
                'execution_time_ms': int((time.time() - start_time) * 1000),
                'error_message': str(e)
            }
    
    def _build_rule_sql(self, rule):
        """Build SQL query for quality rule based on rule type"""
        config = rule.config or {}
        asset = rule.data_asset
        
        if not asset:
            return None
        
        # Get table name from asset
        table_name = config.get('table_name') or asset.source_path or asset.name
        column_name = config.get('column_name', '*')
        
        rule_type = rule.rule_type
        
        if rule_type == 'not_null':
            # Check for null values in a column
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {column_name} IS NOT NULL THEN 1 ELSE 0 END) as passed,
                    SUM(CASE WHEN {column_name} IS NULL THEN 1 ELSE 0 END) as null_count
                FROM {table_name}
            """
        
        elif rule_type == 'unique':
            # Check for duplicate values
            return f"""
                SELECT 
                    COUNT(*) as total,
                    COUNT(DISTINCT {column_name}) as passed,
                    COUNT(*) - COUNT(DISTINCT {column_name}) as duplicates
                FROM {table_name}
            """
        
        elif rule_type == 'in_range':
            # Check values are within specified range
            min_val = config.get('min_value')
            max_val = config.get('max_value')
            conditions = []
            if min_val is not None:
                conditions.append(f"{column_name} >= {min_val}")
            if max_val is not None:
                conditions.append(f"{column_name} <= {max_val}")
            condition = ' AND '.join(conditions) if conditions else '1=1'
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {condition} THEN 1 ELSE 0 END) as passed,
                    AVG({column_name}) as actual_avg
                FROM {table_name}
            """
        
        elif rule_type == 'regex':
            # Check values match a regex pattern
            pattern = config.get('pattern', '.*')
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN REGEXP_LIKE(CAST({column_name} AS VARCHAR), '{pattern}') THEN 1 ELSE 0 END) as passed,
                    SUM(CASE WHEN NOT REGEXP_LIKE(CAST({column_name} AS VARCHAR), '{pattern}') THEN 1 ELSE 0 END) as failures
                FROM {table_name}
            """
        
        elif rule_type == 'in_set':
            # Check values are in a specified set
            allowed_values = config.get('allowed_values', [])
            if not allowed_values:
                return None
            values_str = ', '.join([f"'{v}'" if isinstance(v, str) else str(v) for v in allowed_values])
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {column_name} IN ({values_str}) THEN 1 ELSE 0 END) as passed,
                    SUM(CASE WHEN {column_name} NOT IN ({values_str}) THEN 1 ELSE 0 END) as failures
                FROM {table_name}
            """
        
        elif rule_type == 'referential':
            # Check referential integrity
            ref_table = config.get('reference_table')
            ref_column = config.get('reference_column')
            if not ref_table or not ref_column:
                return None
            return f"""
                SELECT 
                    (SELECT COUNT(*) FROM {table_name}) as total,
                    (SELECT COUNT(*) FROM {table_name} t 
                     WHERE EXISTS (SELECT 1 FROM {ref_table} r WHERE r.{ref_column} = t.{column_name})) as passed,
                    (SELECT COUNT(*) FROM {table_name} t 
                     WHERE NOT EXISTS (SELECT 1 FROM {ref_table} r WHERE r.{ref_column} = t.{column_name})) as orphans
            """
        
        elif rule_type == 'freshness':
            # Check data freshness
            max_age_hours = config.get('max_age_hours', 24)
            timestamp_column = config.get('timestamp_column', column_name)
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {timestamp_column} >= CURRENT_TIMESTAMP - INTERVAL '{max_age_hours}' HOUR THEN 1 ELSE 0 END) as passed,
                    MAX({timestamp_column}) as most_recent
                FROM {table_name}
            """
        
        elif rule_type == 'row_count':
            # Check row count is within expected range
            min_count = config.get('min_count', 0)
            max_count = config.get('max_count')
            if max_count:
                return f"""
                    SELECT 
                        COUNT(*) as total,
                        CASE WHEN COUNT(*) BETWEEN {min_count} AND {max_count} THEN COUNT(*) ELSE 0 END as passed,
                        COUNT(*) as actual_count
                    FROM {table_name}
                """
            else:
                return f"""
                    SELECT 
                        COUNT(*) as total,
                        CASE WHEN COUNT(*) >= {min_count} THEN COUNT(*) ELSE 0 END as passed,
                        COUNT(*) as actual_count
                    FROM {table_name}
                """
        
        elif rule_type == 'completeness':
            # Check overall completeness of required columns
            required_columns = config.get('required_columns', [column_name])
            if not required_columns:
                return None
            checks = ' AND '.join([f"{col} IS NOT NULL" for col in required_columns])
            return f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN {checks} THEN 1 ELSE 0 END) as passed,
                    SUM(CASE WHEN NOT({checks}) THEN 1 ELSE 0 END) as incomplete
                FROM {table_name}
            """
        
        elif rule_type == 'custom_sql':
            # Execute custom SQL
            custom_sql = config.get('sql', '')
            if custom_sql:
                return custom_sql
        
        # Default: count all as passed
        return f"SELECT COUNT(*) as total, COUNT(*) as passed, 0 as failures FROM {table_name}"


class DataQualityResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for data quality results (read-only).
    """
    serializer_class = DataQualityResultSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = DataQualityResult.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(rule__workspace_id=workspace_id)
        
        # Filter by rule
        rule_id = self.request.query_params.get('rule')
        if rule_id:
            queryset = queryset.filter(rule_id=rule_id)
        
        # Filter by passed status
        passed = self.request.query_params.get('passed')
        if passed:
            queryset = queryset.filter(passed=passed.lower() == 'true')
        
        return queryset.order_by('-executed_at')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get quality check summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        rules_qs = DataQualityRule.objects.all()
        results_qs = DataQualityResult.objects.all()
        
        if workspace_id:
            rules_qs = rules_qs.filter(workspace_id=workspace_id)
            results_qs = results_qs.filter(rule__workspace_id=workspace_id)
        
        # Last 24 hours
        since = timezone.now() - timedelta(hours=24)
        recent_results = results_qs.filter(executed_at__gte=since)
        
        passed = recent_results.filter(passed=True).count()
        failed = recent_results.filter(passed=False).count()
        total = passed + failed
        
        summary = {
            'total_rules': rules_qs.count(),
            'active_rules': rules_qs.filter(is_active=True).count(),
            'passed_checks': passed,
            'failed_checks': failed,
            'pass_rate': (passed / total * 100) if total > 0 else 100,
            'by_severity': {
                'critical': results_qs.filter(
                    rule__severity='critical', passed=False
                ).count(),
                'high': results_qs.filter(
                    rule__severity='high', passed=False
                ).count(),
                'medium': results_qs.filter(
                    rule__severity='medium', passed=False
                ).count(),
                'low': results_qs.filter(
                    rule__severity='low', passed=False
                ).count(),
            },
        }
        
        serializer = DataQualitySummarySerializer(summary)
        return Response(serializer.data)


class GlossaryTermViewSet(viewsets.ModelViewSet):
    """
    ViewSet for business glossary terms.
    """
    serializer_class = GlossaryTermSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = GlossaryTerm.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(term__icontains=search) |
                Q(definition__icontains=search) |
                Q(synonyms__icontains=search)
            )
        
        return queryset.order_by('term')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a glossary term."""
        term = self.get_object()
        term.status = 'approved'
        term.save()
        
        serializer = self.get_serializer(term)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of all categories."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = GlossaryTerm.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        categories = queryset.values_list('category', flat=True).distinct()
        return Response(list(filter(None, categories)))


class PolicyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data governance policies.
    """
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Policy.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by policy type
        policy_type = self.request.query_params.get('type')
        if policy_type:
            queryset = queryset.filter(policy_type=policy_type)
        
        # Filter by active status
        active = self.request.query_params.get('active')
        if active:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle policy active status."""
        policy = self.get_object()
        policy.is_active = not policy.is_active
        policy.save()
        
        serializer = self.get_serializer(policy)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get policy summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        queryset = Policy.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        summary = {
            'total_policies': queryset.count(),
            'active_policies': queryset.filter(is_active=True).count(),
            'by_type': list(
                queryset.values('policy_type').annotate(count=Count('id'))
            ),
            'by_enforcement': list(
                queryset.values('enforcement_level').annotate(count=Count('id'))
            ),
        }
        
        return Response(summary)

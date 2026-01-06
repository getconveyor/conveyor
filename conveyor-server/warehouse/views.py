from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsWorkspaceMember
from .models import QueryHistory
from .serializers import (
    QueryExecuteSerializer,
    QueryHistorySerializer,
    TableListSerializer
)
import trino
from django.utils import timezone
import logging
import time
import os
import re
import subprocess

logger = logging.getLogger(__name__)

# Path to Trino namespace directory (mounted from host)
TRINO_NAMESPACE_PATH = '/app/trino-catalogs'  # We'll mount this in docker-compose


class TrinoQueryViewSet(viewsets.ViewSet):
    """ViewSet for executing Trino queries and managing query history"""
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def _get_trino_connection(self):
        """Create Trino connection"""
        return trino.dbapi.connect(
            host='trino',  # Docker service name
            port=8080,
            user='trino',
            catalog='iceberg',
            http_scheme='http',
        )

    @action(detail=False, methods=['post'])
    def execute(self, request):
        """Execute a Trino SQL query"""
        serializer = QueryExecuteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = request.headers.get('X-Workspace-ID')
        query_text = serializer.validated_data['query']
        namespace = serializer.validated_data.get('namespace', 'iceberg')
        schema = serializer.validated_data.get('schema')
        name = serializer.validated_data.get('name')
        limit = serializer.validated_data.get('limit', 1000)

        # Create query history record
        query_history = QueryHistory.objects.create(
            workspace_id=workspace_id,
            user=request.user,
            name=name,
            query_text=query_text,
            namespace=namespace,
            schema=schema,
            status='running'
        )

        start_time = time.time()

        try:
            # Connect to Trino
            conn = self._get_trino_connection()
            cursor = conn.cursor()

            # Set namespace and schema if provided
            if schema:
                cursor.execute(f"USE {namespace}.{schema}")

            # Execute query with limit
            # Strip trailing semicolons - Trino Python client doesn't expect them
            clean_query = query_text.rstrip(';').strip()
            
            if limit and not any(keyword in clean_query.upper() for keyword in ['LIMIT', 'CREATE', 'INSERT', 'UPDATE', 'DELETE']):
                limited_query = f"{clean_query} LIMIT {limit}"
            else:
                limited_query = clean_query

            cursor.execute(limited_query)

            # Fetch results
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()

            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update query history
            query_history.status = 'finished'
            query_history.rows_returned = len(rows)
            query_history.execution_time_ms = execution_time_ms
            query_history.completed_at = timezone.now()
            query_history.save()

            # Convert rows to list of dicts
            data = [
                {col: value for col, value in zip(columns, row)}
                for row in rows
            ]

            cursor.close()
            conn.close()

            return Response({
                'query_id': str(query_history.id),
                'status': 'finished',
                'columns': columns,
                'data': data,
                'rows_returned': len(rows),
                'execution_time_ms': execution_time_ms,
                'execution_time_display': query_history.execution_time_display if hasattr(query_history, 'execution_time_display') else f"{execution_time_ms}ms"
            })

        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")

            execution_time_ms = int((time.time() - start_time) * 1000)

            # Update query history with error
            query_history.status = 'failed'
            query_history.error_message = str(e)
            query_history.execution_time_ms = execution_time_ms
            query_history.completed_at = timezone.now()
            query_history.save()

            return Response({
                'query_id': str(query_history.id),
                'status': 'failed',
                'error': str(e),
                'execution_time_ms': execution_time_ms
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def tables(self, request):
        """List Iceberg tables, optionally filtered by layer"""
        serializer = TableListSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        namespace = serializer.validated_data.get('namespace', 'iceberg')
        schema_filter = serializer.validated_data.get('schema')
        layer = serializer.validated_data.get('layer')

        try:
            conn = self._get_trino_connection()
            cursor = conn.cursor()

            # Get all schemas in the namespace
            cursor.execute(f"SHOW SCHEMAS FROM {namespace}")
            schemas = [row[0] for row in cursor.fetchall()]

            # Filter by layer if specified
            if layer:
                schemas = [s for s in schemas if s == layer or s.startswith(f"{layer}.")]
            elif schema_filter:
                schemas = [s for s in schemas if s == schema_filter]

            # Get tables from each schema
            tables_data = []
            for schema in schemas:
                if schema in ['information_schema', 'sys']:  # Skip system schemas
                    continue

                try:
                    cursor.execute(f"SHOW TABLES FROM {namespace}.{schema}")
                    tables = cursor.fetchall()

                    for table_row in tables:
                        table_name = table_row[0]

                        # Get table stats
                        try:
                            cursor.execute(f"""
                                SELECT
                                    COUNT(*) as row_count
                                FROM {namespace}.{schema}.{table_name}
                            """)
                            row_count = cursor.fetchone()[0]
                        except:
                            row_count = None

                        tables_data.append({
                            'namespace': namespace,
                            'schema': schema,
                            'layer': schema.split('.')[0] if '.' in schema else schema,
                            'schema_namespace': schema.split('.')[1] if '.' in schema and len(schema.split('.')) > 1 else 'default',
                            'table_name': table_name,
                            'full_name': f"{namespace}.{schema}.{table_name}",
                            'row_count': row_count
                        })
                except Exception as e:
                    logger.warning(f"Could not list tables in schema {schema}: {str(e)}")
                    continue

            cursor.close()
            conn.close()

            return Response({
                'namespace': namespace,
                'tables': tables_data,
                'total_tables': len(tables_data)
            })

        except Exception as e:
            logger.error(f"Failed to list tables: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QueryHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for query history"""
    serializer_class = QueryHistorySerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):
        """Filter query history by workspace"""
        workspace_id = self.request.headers.get('X-Workspace-ID')
        if not workspace_id:
            return QueryHistory.objects.none()
        return QueryHistory.objects.filter(workspace_id=workspace_id).select_related('user')

    @action(detail=True, methods=['delete'])
    def delete_query(self, request, pk=None):
        """Delete a saved query from history"""
        query = self.get_object()
        query.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NamespaceViewSet(viewsets.ViewSet):
    """ViewSet for managing Trino Iceberg namespaces (projects)"""
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def _get_namespace_template(self, namespace_name: str) -> str:
        """Generate Iceberg namespace properties file content"""
        return f"""# Iceberg Namespace Configuration for {namespace_name}
connector.name=iceberg

# Hive Metastore configuration
iceberg.catalog.type=hive_metastore
hive.metastore.uri=thrift://hive-metastore:9083

# S3/MinIO configuration
fs.native-s3.enabled=true
s3.endpoint=http://minio:9000
s3.path-style-access=true
s3.aws-access-key=${{ENV:AWS_ACCESS_KEY_ID}}
s3.aws-secret-key=${{ENV:AWS_SECRET_ACCESS_KEY}}

# Iceberg table format settings
iceberg.file-format=PARQUET
iceberg.compression-codec=SNAPPY

# Performance tuning
iceberg.max-partitions-per-writer=100
iceberg.minimum-assigned-split-weight=0.05
"""

    def _validate_namespace_name(self, name: str) -> tuple[bool, str]:
        """Validate namespace name"""
        if not name:
            return False, "Namespace name is required"
        if not re.match(r'^[a-z][a-z0-9_]*$', name):
            return False, "Namespace name must start with a letter and contain only lowercase letters, numbers, and underscores"
        if len(name) > 50:
            return False, "Namespace name must be 50 characters or less"
        if name in ['system', 'information_schema']:
            return False, "This namespace name is reserved"
        return True, ""

    def list(self, request):
        """List all available namespaces"""
        try:
            namespaces = []
            
            # List namespace files from the mounted directory
            if os.path.exists(TRINO_NAMESPACE_PATH):
                for filename in os.listdir(TRINO_NAMESPACE_PATH):
                    if filename.endswith('.properties'):
                        namespace_name = filename[:-11]  # Remove .properties
                        file_path = os.path.join(TRINO_NAMESPACE_PATH, filename)
                        
                        # Read the file to check connector type
                        connector_type = 'unknown'
                        try:
                            with open(file_path, 'r') as f:
                                content = f.read()
                                if 'connector.name=iceberg' in content:
                                    connector_type = 'iceberg'
                                elif 'connector.name=postgresql' in content:
                                    connector_type = 'postgresql'
                                elif 'connector.name=mysql' in content:
                                    connector_type = 'mysql'
                        except Exception:
                            pass
                        
                        namespaces.append({
                            'name': namespace_name,
                            'connector': connector_type,
                            'file': filename,
                            'is_system': namespace_name in ['system', 'information_schema'],
                            'is_default': namespace_name == 'iceberg'
                        })
            
            return Response({
                'namespaces': sorted(namespaces, key=lambda x: x['name']),
                'total': len(namespaces)
            })
            
        except Exception as e:
            logger.error(f"Failed to list namespaces: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        """Create a new Iceberg namespace"""
        name = request.data.get('name', '').lower().strip()
        description = request.data.get('description', '')
        
        # Validate name
        is_valid, error = self._validate_namespace_name(name)
        if not is_valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if namespace already exists
        namespace_file = os.path.join(TRINO_NAMESPACE_PATH, f'{name}.properties')
        if os.path.exists(namespace_file):
            return Response({
                'error': f'Namespace "{name}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create the namespace properties file
            content = self._get_namespace_template(name)
            
            with open(namespace_file, 'w') as f:
                f.write(content)
            
            logger.info(f"Created namespace: {name}")
            
            return Response({
                'name': name,
                'message': f'Namespace "{name}" created successfully. Restart Trino to activate.',
                'restart_required': True
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Failed to create namespace {name}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        """Delete a namespace"""
        namespace_name = pk
        
        if namespace_name in ['iceberg', 'system', 'information_schema', 'postgres']:
            return Response({
                'error': 'Cannot delete system or default namespaces'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        namespace_file = os.path.join(TRINO_NAMESPACE_PATH, f'{namespace_name}.properties')
        
        if not os.path.exists(namespace_file):
            return Response({
                'error': f'Namespace "{namespace_name}" not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            os.remove(namespace_file)
            logger.info(f"Deleted namespace: {namespace_name}")
            
            return Response({
                'message': f'Namespace "{namespace_name}" deleted. Restart Trino to apply.',
                'restart_required': True
            })
            
        except Exception as e:
            logger.error(f"Failed to delete namespace {namespace_name}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def restart_trino(self, request):
        """Restart Trino container to reload namespaces"""
        try:
            # This would typically be done via Docker API or a management script
            # For now, we'll return instructions
            return Response({
                'message': 'To reload namespaces, restart the Trino container',
                'command': 'docker restart conveyor-trino'
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def schemas(self, request, pk=None):
        """Get all schemas and tables for a namespace (for schema browser)"""
        namespace_name = pk

        try:
            conn = trino.dbapi.connect(
                host=os.getenv('TRINO_HOST', 'trino'),
                port=int(os.getenv('TRINO_PORT', 8080)),
                user='conveyor',
                catalog=namespace_name,
            )
            cursor = conn.cursor()

            # Get all schemas in the namespace
            cursor.execute(f"SHOW SCHEMAS FROM {namespace_name}")
            schemas = [row[0] for row in cursor.fetchall()]

            # Build schema tree
            schema_tree = []
            for schema in schemas:
                if schema in ['information_schema', 'sys']:
                    continue

                schema_node = {
                    'id': f"{namespace_name}-{schema}",
                    'name': schema,
                    'type': 'schema',
                    'children': []
                }

                # Determine layer based on schema name
                if schema in ['bronze', 'silver', 'gold']:
                    schema_node['type'] = 'layer'
                    schema_node['layer'] = schema

                try:
                    # Get tables in this schema
                    cursor.execute(f"SHOW TABLES FROM {namespace_name}.{schema}")
                    tables = cursor.fetchall()

                    for table_row in tables:
                        table_name = table_row[0]
                        table_node = {
                            'id': f"{namespace_name}-{schema}-{table_name}",
                            'name': table_name,
                            'type': 'table',
                            'children': []
                        }

                        try:
                            # Get columns for this table
                            cursor.execute(f"DESCRIBE {namespace_name}.{schema}.{table_name}")
                            columns = cursor.fetchall()

                            for col_row in columns:
                                col_name = col_row[0]
                                col_type = col_row[1] if len(col_row) > 1 else 'unknown'
                                table_node['children'].append({
                                    'id': f"{namespace_name}-{schema}-{table_name}-{col_name}",
                                    'name': col_name,
                                    'type': 'column',
                                    'dataType': col_type.upper()
                                })
                        except Exception as e:
                            logger.warning(f"Could not describe table {table_name}: {str(e)}")

                        schema_node['children'].append(table_node)

                except Exception as e:
                    logger.warning(f"Could not list tables in schema {schema}: {str(e)}")

                schema_tree.append(schema_node)

            cursor.close()
            conn.close()

            # Wrap in namespace node
            result = [{
                'id': namespace_name,
                'name': namespace_name,
                'type': 'namespace',
                'children': schema_tree
            }]

            return Response({
                'namespace': namespace_name,
                'schema_tree': result
            })

        except Exception as e:
            logger.error(f"Failed to get schemas for namespace {namespace_name}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

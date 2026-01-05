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

# Path to Trino catalog directory (mounted from host)
TRINO_CATALOG_PATH = '/app/trino-catalogs'  # We'll mount this in docker-compose


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
        catalog = serializer.validated_data.get('catalog', 'iceberg')
        schema = serializer.validated_data.get('schema')
        name = serializer.validated_data.get('name')
        limit = serializer.validated_data.get('limit', 1000)

        # Create query history record
        query_history = QueryHistory.objects.create(
            workspace_id=workspace_id,
            user=request.user,
            name=name,
            query_text=query_text,
            catalog=catalog,
            schema=schema,
            status='running'
        )

        start_time = time.time()

        try:
            # Connect to Trino
            conn = self._get_trino_connection()
            cursor = conn.cursor()

            # Set catalog and schema if provided
            if schema:
                cursor.execute(f"USE {catalog}.{schema}")

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

        catalog = serializer.validated_data.get('catalog', 'iceberg')
        schema_filter = serializer.validated_data.get('schema')
        layer = serializer.validated_data.get('layer')

        try:
            conn = self._get_trino_connection()
            cursor = conn.cursor()

            # Get all schemas in the catalog
            cursor.execute(f"SHOW SCHEMAS FROM {catalog}")
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
                    cursor.execute(f"SHOW TABLES FROM {catalog}.{schema}")
                    tables = cursor.fetchall()

                    for table_row in tables:
                        table_name = table_row[0]

                        # Get table stats
                        try:
                            cursor.execute(f"""
                                SELECT
                                    COUNT(*) as row_count
                                FROM {catalog}.{schema}.{table_name}
                            """)
                            row_count = cursor.fetchone()[0]
                        except:
                            row_count = None

                        tables_data.append({
                            'catalog': catalog,
                            'schema': schema,
                            'layer': schema.split('.')[0] if '.' in schema else schema,
                            'namespace': schema.split('.')[1] if '.' in schema and len(schema.split('.')) > 1 else 'default',
                            'table_name': table_name,
                            'full_name': f"{catalog}.{schema}.{table_name}",
                            'row_count': row_count
                        })
                except Exception as e:
                    logger.warning(f"Could not list tables in schema {schema}: {str(e)}")
                    continue

            cursor.close()
            conn.close()

            return Response({
                'catalog': catalog,
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


class CatalogViewSet(viewsets.ViewSet):
    """ViewSet for managing Trino Iceberg catalogs (projects)"""
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def _get_catalog_template(self, catalog_name: str) -> str:
        """Generate Iceberg catalog properties file content"""
        return f"""# Iceberg Catalog Configuration for {catalog_name}
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

    def _validate_catalog_name(self, name: str) -> tuple[bool, str]:
        """Validate catalog name"""
        if not name:
            return False, "Catalog name is required"
        if not re.match(r'^[a-z][a-z0-9_]*$', name):
            return False, "Catalog name must start with a letter and contain only lowercase letters, numbers, and underscores"
        if len(name) > 50:
            return False, "Catalog name must be 50 characters or less"
        if name in ['system', 'information_schema']:
            return False, "This catalog name is reserved"
        return True, ""

    def list(self, request):
        """List all available catalogs"""
        try:
            catalogs = []
            
            # List catalog files from the mounted directory
            if os.path.exists(TRINO_CATALOG_PATH):
                for filename in os.listdir(TRINO_CATALOG_PATH):
                    if filename.endswith('.properties'):
                        catalog_name = filename[:-11]  # Remove .properties
                        file_path = os.path.join(TRINO_CATALOG_PATH, filename)
                        
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
                        
                        catalogs.append({
                            'name': catalog_name,
                            'connector': connector_type,
                            'file': filename,
                            'is_system': catalog_name in ['system', 'information_schema'],
                            'is_default': catalog_name == 'iceberg'
                        })
            
            return Response({
                'catalogs': sorted(catalogs, key=lambda x: x['name']),
                'total': len(catalogs)
            })
            
        except Exception as e:
            logger.error(f"Failed to list catalogs: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        """Create a new Iceberg catalog"""
        name = request.data.get('name', '').lower().strip()
        description = request.data.get('description', '')
        
        # Validate name
        is_valid, error = self._validate_catalog_name(name)
        if not is_valid:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if catalog already exists
        catalog_file = os.path.join(TRINO_CATALOG_PATH, f'{name}.properties')
        if os.path.exists(catalog_file):
            return Response({
                'error': f'Catalog "{name}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create the catalog properties file
            content = self._get_catalog_template(name)
            
            with open(catalog_file, 'w') as f:
                f.write(content)
            
            logger.info(f"Created catalog: {name}")
            
            return Response({
                'name': name,
                'message': f'Catalog "{name}" created successfully. Restart Trino to activate.',
                'restart_required': True
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Failed to create catalog {name}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        """Delete a catalog"""
        catalog_name = pk
        
        if catalog_name in ['iceberg', 'system', 'information_schema', 'postgres']:
            return Response({
                'error': 'Cannot delete system or default catalogs'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        catalog_file = os.path.join(TRINO_CATALOG_PATH, f'{catalog_name}.properties')
        
        if not os.path.exists(catalog_file):
            return Response({
                'error': f'Catalog "{catalog_name}" not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            os.remove(catalog_file)
            logger.info(f"Deleted catalog: {catalog_name}")
            
            return Response({
                'message': f'Catalog "{catalog_name}" deleted. Restart Trino to apply.',
                'restart_required': True
            })
            
        except Exception as e:
            logger.error(f"Failed to delete catalog {catalog_name}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def restart_trino(self, request):
        """Restart Trino container to reload catalogs"""
        try:
            # This would typically be done via Docker API or a management script
            # For now, we'll return instructions
            return Response({
                'message': 'To reload catalogs, restart the Trino container',
                'command': 'docker restart conveyor-trino'
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

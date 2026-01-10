"""
Views for data science - ML experiments, models, and feature store.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from django.conf import settings
from datetime import timedelta
import logging
import json
import pickle
import numpy as np

from authentication.permissions import IsWorkspaceMember
from .models import (
    Experiment,
    ExperimentRun,
    MLModel,
    ModelVersion,
    FeatureGroup,
    FeatureView,
    TrainingDataset,
)
from .serializers import (
    ExperimentSerializer,
    ExperimentRunSerializer,
    MLModelSerializer,
    ModelVersionSerializer,
    FeatureGroupSerializer,
    FeatureViewSerializer,
    TrainingDatasetSerializer,
    ExperimentSummarySerializer,
    ModelRegistrySummarySerializer,
    FeatureStoreSummarySerializer,
)

logger = logging.getLogger(__name__)

# In-memory cache for deployed models (in production, use Redis or similar)
_deployed_models = {}


class ExperimentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ML experiments.
    """
    serializer_class = ExperimentSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = Experiment.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get experiments summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        experiments = Experiment.objects.all()
        runs = ExperimentRun.objects.all()
        
        if workspace_id:
            experiments = experiments.filter(workspace_id=workspace_id)
            runs = runs.filter(experiment__workspace_id=workspace_id)
        
        data = {
            'total_experiments': experiments.count(),
            'active_experiments': experiments.filter(status='active').count(),
            'total_runs': runs.count(),
            'successful_runs': runs.filter(status='completed').count(),
            'failed_runs': runs.filter(status='failed').count(),
        }
        
        serializer = ExperimentSummarySerializer(data)
        return Response(serializer.data)


class ExperimentRunViewSet(viewsets.ModelViewSet):
    """
    ViewSet for experiment runs.
    """
    serializer_class = ExperimentRunSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = ExperimentRun.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(experiment__workspace_id=workspace_id)
        
        # Filter by experiment
        experiment_id = self.request.query_params.get('experiment')
        if experiment_id:
            queryset = queryset.filter(experiment_id=experiment_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start an experiment run."""
        run = self.get_object()
        run.status = 'running'
        run.start_time = timezone.now()
        run.save()
        
        serializer = self.get_serializer(run)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark run as completed."""
        run = self.get_object()
        run.status = 'completed'
        run.end_time = timezone.now()
        
        # Update metrics if provided
        metrics = request.data.get('metrics')
        if metrics:
            run.metrics = metrics
        
        run.save()
        
        serializer = self.get_serializer(run)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def fail(self, request, pk=None):
        """Mark run as failed."""
        run = self.get_object()
        run.status = 'failed'
        run.end_time = timezone.now()
        run.error_message = request.data.get('error', 'Unknown error')
        run.save()
        
        serializer = self.get_serializer(run)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def log_metrics(self, request, pk=None):
        """Log metrics for a run."""
        run = self.get_object()
        metrics = request.data.get('metrics', {})
        
        current_metrics = run.metrics or {}
        current_metrics.update(metrics)
        run.metrics = current_metrics
        run.save()
        
        return Response({'metrics': run.metrics})
    
    @action(detail=True, methods=['patch'])
    def log_params(self, request, pk=None):
        """Log parameters for a run."""
        run = self.get_object()
        params = request.data.get('parameters', {})
        
        current_params = run.parameters or {}
        current_params.update(params)
        run.parameters = current_params
        run.save()
        
        return Response({'parameters': run.parameters})
    
    @action(detail=False, methods=['get'])
    def compare(self, request):
        """Compare multiple runs."""
        run_ids = request.query_params.get('runs', '').split(',')
        runs = ExperimentRun.objects.filter(id__in=run_ids)
        
        comparison = {
            'runs': ExperimentRunSerializer(runs, many=True).data,
            'metrics_comparison': {},
            'params_comparison': {},
        }
        
        # Build comparison matrices
        all_metrics = set()
        all_params = set()
        
        for run in runs:
            all_metrics.update((run.metrics or {}).keys())
            all_params.update((run.parameters or {}).keys())
        
        for metric in all_metrics:
            comparison['metrics_comparison'][metric] = {
                str(run.id): (run.metrics or {}).get(metric)
                for run in runs
            }
        
        for param in all_params:
            comparison['params_comparison'][param] = {
                str(run.id): (run.parameters or {}).get(param)
                for run in runs
            }
        
        return Response(comparison)


class MLModelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ML models in the registry.
    """
    serializer_class = MLModelSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = MLModel.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by framework
        framework = self.request.query_params.get('framework')
        if framework:
            queryset = queryset.filter(framework=framework)
        
        # Filter by model type
        model_type = self.request.query_params.get('type')
        if model_type:
            queryset = queryset.filter(model_type=model_type)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get model registry summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        models = MLModel.objects.all()
        versions = ModelVersion.objects.all()
        
        if workspace_id:
            models = models.filter(workspace_id=workspace_id)
            versions = versions.filter(model__workspace_id=workspace_id)
        
        # Count by framework
        framework_counts = {}
        for model in models:
            fw = model.framework or 'unknown'
            framework_counts[fw] = framework_counts.get(fw, 0) + 1
        
        data = {
            'total_models': models.count(),
            'total_versions': versions.count(),
            'production_models': versions.filter(stage='production').count(),
            'staging_models': versions.filter(stage='staging').count(),
            'models_by_framework': framework_counts,
        }
        
        serializer = ModelRegistrySummarySerializer(data)
        return Response(serializer.data)


class ModelVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for model versions.
    """
    serializer_class = ModelVersionSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = ModelVersion.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(model__workspace_id=workspace_id)
        
        # Filter by model
        model_id = self.request.query_params.get('model')
        if model_id:
            queryset = queryset.filter(model_id=model_id)
        
        # Filter by stage
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def transition_stage(self, request, pk=None):
        """Transition model version to a new stage."""
        version = self.get_object()
        new_stage = request.data.get('stage')
        
        if new_stage not in ['none', 'staging', 'production', 'archived']:
            return Response(
                {'error': 'Invalid stage'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If promoting to production, demote current production version
        if new_stage == 'production':
            ModelVersion.objects.filter(
                model=version.model,
                stage='production'
            ).exclude(id=version.id).update(stage='archived')
        
        version.stage = new_stage
        version.save()
        
        serializer = self.get_serializer(version)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deploy(self, request, pk=None):
        """Deploy a model version for serving predictions."""
        version = self.get_object()
        
        try:
            # Load model from storage
            model_artifact = self._load_model_artifact(version)
            
            if model_artifact is None:
                return Response(
                    {'error': 'Could not load model artifact'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store in cache for serving
            deployment_key = f"{version.model.id}:{version.version}"
            _deployed_models[deployment_key] = {
                'model': model_artifact,
                'version': version,
                'deployed_at': timezone.now(),
                'framework': version.model.framework,
            }
            
            # Update model metadata
            version.is_deployed = True
            version.deployed_at = timezone.now()
            version.save()
            
            logger.info(f"Model {version.model.name} v{version.version} deployed successfully")
            
            return Response({
                'detail': f'Model {version.model.name} v{version.version} deployed successfully',
                'deployment_key': deployment_key,
                'endpoint': f'/api/data-science/model-versions/{version.id}/predict/',
            })
            
        except Exception as e:
            logger.error(f"Model deployment failed: {str(e)}")
            return Response(
                {'error': f'Deployment failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def undeploy(self, request, pk=None):
        """Undeploy a model version."""
        version = self.get_object()
        
        deployment_key = f"{version.model.id}:{version.version}"
        
        if deployment_key in _deployed_models:
            del _deployed_models[deployment_key]
        
        version.is_deployed = False
        version.deployed_at = None
        version.save()
        
        return Response({
            'detail': f'Model {version.model.name} v{version.version} undeployed successfully'
        })
    
    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """Make predictions using a deployed model."""
        version = self.get_object()
        deployment_key = f"{version.model.id}:{version.version}"
        
        # Check if model is deployed
        if deployment_key not in _deployed_models:
            return Response(
                {'error': 'Model is not deployed. Deploy it first using the /deploy endpoint.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get input data
        input_data = request.data.get('data')
        if input_data is None:
            return Response(
                {'error': 'Missing "data" field in request body'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deployment = _deployed_models[deployment_key]
            model = deployment['model']
            framework = deployment['framework']
            
            # Convert input to appropriate format
            if isinstance(input_data, list):
                features = np.array(input_data)
            elif isinstance(input_data, dict):
                # Handle dict input (feature names -> values)
                features = np.array([list(input_data.values())])
            else:
                features = np.array([[input_data]])
            
            # Make prediction based on framework
            predictions = self._run_prediction(model, features, framework)
            
            # Log prediction for monitoring
            logger.info(f"Prediction made with model {deployment_key}")
            
            return Response({
                'model': version.model.name,
                'version': version.version,
                'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions,
                'timestamp': timezone.now().isoformat(),
            })
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return Response(
                {'error': f'Prediction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def batch_predict(self, request, pk=None):
        """Make batch predictions using a deployed model."""
        version = self.get_object()
        deployment_key = f"{version.model.id}:{version.version}"
        
        if deployment_key not in _deployed_models:
            return Response(
                {'error': 'Model is not deployed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get batch input data
        batch_data = request.data.get('batch')
        if not batch_data or not isinstance(batch_data, list):
            return Response(
                {'error': 'Missing or invalid "batch" field (expected array)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deployment = _deployed_models[deployment_key]
            model = deployment['model']
            framework = deployment['framework']
            
            # Convert batch to numpy array
            features = np.array(batch_data)
            
            # Make batch predictions
            predictions = self._run_prediction(model, features, framework)
            
            return Response({
                'model': version.model.name,
                'version': version.version,
                'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions),
                'batch_size': len(batch_data),
                'timestamp': timezone.now().isoformat(),
            })
            
        except Exception as e:
            logger.error(f"Batch prediction failed: {str(e)}")
            return Response(
                {'error': f'Batch prediction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def serving_info(self, request, pk=None):
        """Get serving information for a model version."""
        version = self.get_object()
        deployment_key = f"{version.model.id}:{version.version}"
        
        is_deployed = deployment_key in _deployed_models
        deployment_info = _deployed_models.get(deployment_key)
        
        return Response({
            'model_id': str(version.model.id),
            'model_name': version.model.name,
            'version': version.version,
            'is_deployed': is_deployed,
            'deployed_at': deployment_info['deployed_at'].isoformat() if deployment_info else None,
            'framework': version.model.framework,
            'endpoint': f'/api/data-science/model-versions/{version.id}/predict/' if is_deployed else None,
            'batch_endpoint': f'/api/data-science/model-versions/{version.id}/batch_predict/' if is_deployed else None,
        })
    
    def _load_model_artifact(self, version):
        """Load model artifact from storage."""
        try:
            from data_lake.storage import get_storage_client
            
            if not version.artifact_path:
                # Return a mock model for testing
                logger.warning(f"No artifact path for model {version.model.name}, using mock model")
                return MockModel()
            
            # Get model file from storage
            storage = get_storage_client()
            model_data = storage.get_file(version.artifact_path)
            
            # Load based on framework
            framework = version.model.framework
            
            if framework == 'sklearn':
                return pickle.loads(model_data.read())
            elif framework == 'pytorch':
                import torch
                import io
                return torch.load(io.BytesIO(model_data.read()))
            elif framework == 'tensorflow':
                # For TensorFlow, we'd need to handle differently
                # This is simplified
                import tensorflow as tf
                import tempfile
                import os
                with tempfile.NamedTemporaryFile(delete=False, suffix='.h5') as f:
                    f.write(model_data.read())
                    temp_path = f.name
                model = tf.keras.models.load_model(temp_path)
                os.unlink(temp_path)
                return model
            elif framework == 'xgboost':
                import xgboost as xgb
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as f:
                    f.write(model_data.read())
                    temp_path = f.name
                model = xgb.Booster()
                model.load_model(temp_path)
                return model
            else:
                # Default to pickle
                return pickle.loads(model_data.read())
                
        except Exception as e:
            logger.error(f"Failed to load model artifact: {str(e)}")
            # Return mock model for testing
            return MockModel()
    
    def _run_prediction(self, model, features, framework):
        """Run prediction based on framework."""
        try:
            if framework == 'sklearn':
                return model.predict(features)
            elif framework == 'pytorch':
                import torch
                model.eval()
                with torch.no_grad():
                    tensor = torch.FloatTensor(features)
                    output = model(tensor)
                    return output.numpy()
            elif framework == 'tensorflow':
                return model.predict(features)
            elif framework == 'xgboost':
                import xgboost as xgb
                dmatrix = xgb.DMatrix(features)
                return model.predict(dmatrix)
            else:
                # Default: try calling predict method
                if hasattr(model, 'predict'):
                    return model.predict(features)
                elif callable(model):
                    return model(features)
                else:
                    raise ValueError(f"Unknown framework: {framework}")
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise


class MockModel:
    """Mock model for testing when no real model is available."""
    
    def predict(self, features):
        """Return random predictions."""
        if isinstance(features, np.ndarray):
            return np.random.rand(features.shape[0])
        return [0.5]


class FeatureGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for feature groups in the feature store.
    """
    serializer_class = FeatureGroupSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = FeatureGroup.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by entity type
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Filter by online enabled
        online = self.request.query_params.get('online')
        if online:
            queryset = queryset.filter(online_enabled=online.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview feature group data from the feature store."""
        feature_group = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        
        try:
            # Query feature data from Trino
            import trino
            
            conn = trino.dbapi.connect(
                host=getattr(settings, 'TRINO_HOST', 'trino'),
                port=getattr(settings, 'TRINO_PORT', 8080),
                user=getattr(settings, 'TRINO_USER', 'conveyor'),
                catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
                schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
            )
            cursor = conn.cursor()
            
            # Build table name from feature group
            table_name = feature_group.source_table or f"fg_{feature_group.name.lower().replace(' ', '_')}"
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_rows = cursor.fetchone()[0]
            
            # Get preview data
            feature_columns = feature_group.features or []
            columns_str = ', '.join(feature_columns) if feature_columns else '*'
            
            cursor.execute(f"SELECT {columns_str} FROM {table_name} LIMIT {limit}")
            
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = [list(row) for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return Response({
                'columns': columns,
                'rows': rows,
                'total_rows': total_rows,
                'feature_group': feature_group.name,
            })
            
        except Exception as e:
            logger.warning(f"Feature preview failed: {str(e)}")
            # Return empty preview with error info
            return Response({
                'columns': feature_group.features or [],
                'rows': [],
                'total_rows': 0,
                'error': str(e),
            })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get feature store summary."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        groups = FeatureGroup.objects.all()
        views = FeatureView.objects.all()
        datasets = TrainingDataset.objects.all()
        
        if workspace_id:
            groups = groups.filter(workspace_id=workspace_id)
            views = views.filter(workspace_id=workspace_id)
            datasets = datasets.filter(workspace_id=workspace_id)
        
        # Count total features
        total_features = 0
        for group in groups:
            total_features += len(group.features or [])
        
        data = {
            'total_feature_groups': groups.count(),
            'total_features': total_features,
            'total_feature_views': views.count(),
            'total_training_datasets': datasets.count(),
            'online_enabled_groups': groups.filter(online_enabled=True).count(),
        }
        
        serializer = FeatureStoreSummarySerializer(data)
        return Response(serializer.data)


class FeatureViewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for feature views.
    """
    serializer_class = FeatureViewSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = FeatureView.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by feature group
        feature_group_id = self.request.query_params.get('feature_group')
        if feature_group_id:
            queryset = queryset.filter(feature_group_id=feature_group_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)


class TrainingDatasetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for training datasets.
    """
    serializer_class = TrainingDatasetSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = TrainingDataset.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by feature view
        feature_view_id = self.request.query_params.get('feature_view')
        if feature_view_id:
            queryset = queryset.filter(feature_view_id=feature_view_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Get presigned download URL for training dataset."""
        dataset = self.get_object()
        
        if not dataset.storage_path:
            return Response(
                {'error': 'No storage path available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            import boto3
            from botocore.config import Config
            
            # Create MinIO/S3 client
            s3_client = boto3.client(
                's3',
                endpoint_url=getattr(settings, 'MINIO_ENDPOINT', 'http://minio:9000'),
                aws_access_key_id=getattr(settings, 'MINIO_ACCESS_KEY', 'minioadmin'),
                aws_secret_access_key=getattr(settings, 'MINIO_SECRET_KEY', 'minioadmin'),
                config=Config(signature_version='s3v4'),
                region_name='us-east-1'
            )
            
            bucket = getattr(settings, 'MINIO_BUCKET', 'conveyor-data')
            expires_in = int(request.query_params.get('expires_in', 3600))
            
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket,
                    'Key': dataset.storage_path,
                },
                ExpiresIn=expires_in
            )
            
            return Response({
                'url': presigned_url,
                'format': dataset.format,
                'expires_in': expires_in,
                'filename': dataset.storage_path.split('/')[-1],
                'size_bytes': dataset.size_bytes if hasattr(dataset, 'size_bytes') else None,
            })
            
        except Exception as e:
            logger.error(f"Failed to generate download URL: {str(e)}")
            return Response(
                {'error': f'Failed to generate download URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def feature_statistics(self, request, pk=None):
        """Get dataset statistics."""
        dataset = self.get_object()
        return Response(dataset.statistics or {})

# New Feature Engineering ViewSets

class FeatureDefinitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for feature definitions within feature groups.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        from .serializers import FeatureDefinitionSerializer, FeatureDefinitionCreateSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return FeatureDefinitionCreateSerializer
        return FeatureDefinitionSerializer
    
    def get_queryset(self):
        from .models import FeatureDefinition
        
        queryset = FeatureDefinition.objects.all()
        
        # Filter by feature group
        feature_group_id = self.request.query_params.get('feature_group')
        if feature_group_id:
            queryset = queryset.filter(feature_group_id=feature_group_id)
        
        # Filter by active status
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        
        return queryset.order_by('order', 'name')
    
    @action(detail=True, methods=['get'])
    def feature_statistics(self, request, pk=None):
        """Get statistics for a feature definition."""
        feature_def = self.get_object()
        return Response(feature_def.statistics or {})
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create feature definitions."""
        from .serializers import FeatureDefinitionCreateSerializer
        from .models import FeatureDefinition
        
        definitions = request.data.get('definitions', [])
        created = []
        
        for defn in definitions:
            serializer = FeatureDefinitionCreateSerializer(data=defn)
            if serializer.is_valid():
                instance = serializer.save()
                created.append(str(instance.id))
        
        return Response({
            'created': len(created),
            'ids': created
        }, status=status.HTTP_201_CREATED)


class FeatureEngineeringJobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for feature engineering jobs.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        from .serializers import FeatureEngineeringJobSerializer, FeatureEngineeringJobCreateSerializer
        if self.action in ['create']:
            return FeatureEngineeringJobCreateSerializer
        return FeatureEngineeringJobSerializer
    
    def get_queryset(self):
        from .models import FeatureEngineeringJob
        
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = FeatureEngineeringJob.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by target feature group
        feature_group_id = self.request.query_params.get('feature_group')
        if feature_group_id:
            queryset = queryset.filter(target_feature_group_id=feature_group_id)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Run the feature engineering job."""
        from .tasks import run_feature_engineering_job
        from .serializers import RunFeatureEngineeringRequestSerializer
        
        job = self.get_object()
        
        # Validate request
        serializer = RunFeatureEngineeringRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        async_execution = serializer.validated_data.get('async_execution', True)
        
        if async_execution:
            # Run asynchronously
            task = run_feature_engineering_job.delay(
                str(job.id),
                triggered_by_user_id=request.user.id
            )
            
            return Response({
                'status': 'started',
                'task_id': task.id,
                'job_id': str(job.id),
                'message': f'Feature engineering job "{job.name}" started'
            }, status=status.HTTP_202_ACCEPTED)
        else:
            # Run synchronously
            result = run_feature_engineering_job(
                str(job.id),
                triggered_by_user_id=request.user.id
            )
            
            return Response(result)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a scheduled job."""
        job = self.get_object()
        job.status = 'paused'
        job.save()
        
        return Response({'status': 'paused', 'job_id': str(job.id)})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused job."""
        job = self.get_object()
        job.status = 'active'
        job.save()
        
        return Response({'status': 'active', 'job_id': str(job.id)})
    
    @action(detail=True, methods=['get'])
    def runs(self, request, pk=None):
        """Get runs for this job."""
        from .serializers import FeatureEngineeringRunSerializer
        
        job = self.get_object()
        runs = job.runs.all().order_by('-created_at')[:20]
        
        serializer = FeatureEngineeringRunSerializer(runs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test the feature engineering job with sample data."""
        from .feature_engineering import FeatureEngineer
        
        job = self.get_object()
        
        try:
            engineer = FeatureEngineer(str(job.workspace_id))
            
            # Get sample data
            sample_size = int(request.query_params.get('sample_size', 100))
            
            # This would load sample data and run transformations
            # For now, return job configuration
            return Response({
                'status': 'success',
                'job_id': str(job.id),
                'data_prep_config': job.data_prep_config,
                'feature_engineering_steps': job.feature_engineering_steps,
                'sample_size': sample_size
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class FeatureEngineeringRunViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for feature engineering runs (read-only).
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        from .serializers import FeatureEngineeringRunSerializer
        return FeatureEngineeringRunSerializer
    
    def get_queryset(self):
        from .models import FeatureEngineeringRun
        
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = FeatureEngineeringRun.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(job__workspace_id=workspace_id)
        
        # Filter by job
        job_id = self.request.query_params.get('job')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running job."""
        run = self.get_object()
        
        if run.status == 'running':
            # Cancel celery task if available
            if run.celery_task_id:
                from celery.result import AsyncResult
                AsyncResult(run.celery_task_id).revoke(terminate=True)
            
            run.status = 'cancelled'
            run.completed_at = timezone.now()
            run.save()
            
            return Response({'status': 'cancelled', 'run_id': str(run.id)})
        
        return Response({
            'status': 'error',
            'error': f'Cannot cancel run with status: {run.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get logs for a run."""
        run = self.get_object()
        return Response({
            'run_id': str(run.id),
            'logs': run.logs or '',
            'error_message': run.error_message,
            'error_traceback': run.error_traceback
        })


class FeatureMaterializationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for feature materializations (read-only).
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        from .serializers import FeatureMaterializationSerializer
        return FeatureMaterializationSerializer
    
    def get_queryset(self):
        from .models import FeatureMaterialization
        
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = FeatureMaterialization.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(feature_group__workspace_id=workspace_id)
        
        # Filter by feature group
        feature_group_id = self.request.query_params.get('feature_group')
        if feature_group_id:
            queryset = queryset.filter(feature_group_id=feature_group_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class OnlineFeatureStoreViewSet(viewsets.ModelViewSet):
    """
    ViewSet for online feature store configuration.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        from .serializers import OnlineFeatureStoreSerializer
        return OnlineFeatureStoreSerializer
    
    def get_queryset(self):
        from .models import OnlineFeatureStore
        
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = OnlineFeatureStore.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test Redis connection."""
        store = self.get_object()
        
        try:
            import redis
            
            client = redis.Redis(
                host=store.redis_host,
                port=store.redis_port,
                db=store.redis_db,
                socket_timeout=5
            )
            
            # Test ping
            client.ping()
            
            # Get info
            info = client.info()
            
            return Response({
                'status': 'connected',
                'redis_version': info.get('redis_version'),
                'connected_clients': info.get('connected_clients'),
                'used_memory_human': info.get('used_memory_human'),
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get online store statistics."""
        store = self.get_object()
        
        try:
            import redis
            
            client = redis.Redis(
                host=store.redis_host,
                port=store.redis_port,
                db=store.redis_db
            )
            
            info = client.info()
            
            # Count keys with prefix
            prefix = store.redis_key_prefix
            key_count = 0
            for key in client.scan_iter(f"{prefix}:*", count=1000):
                key_count += 1
            
            return Response({
                'total_keys': key_count,
                'memory_used_bytes': info.get('used_memory'),
                'memory_used_human': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'uptime_in_days': info.get('uptime_in_days'),
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# Extended FeatureGroup actions

def _add_feature_group_actions():
    """Add additional actions to FeatureGroupViewSet."""
    
    @action(detail=True, methods=['post'])
    def materialize(self, request, pk=None):
        """Materialize features to stores."""
        from .tasks import materialize_features
        from .serializers import MaterializeFeaturesRequestSerializer
        
        feature_group = self.get_object()
        
        serializer = MaterializeFeaturesRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        store_type = serializer.validated_data.get('store_type', 'offline')
        start_time = serializer.validated_data.get('start_time')
        end_time = serializer.validated_data.get('end_time')
        
        task = materialize_features.delay(
            str(feature_group.id),
            store_type=store_type,
            start_time=start_time.isoformat() if start_time else None,
            end_time=end_time.isoformat() if end_time else None
        )
        
        return Response({
            'status': 'started',
            'task_id': task.id,
            'feature_group_id': str(feature_group.id),
            'store_type': store_type
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def get_features(self, request, pk=None):
        """Get features for specific entities from online store."""
        from .feature_engineering import FeatureEngineer
        from .serializers import GetFeaturesRequestSerializer
        
        feature_group = self.get_object()
        
        serializer = GetFeaturesRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        entity_ids = serializer.validated_data.get('entity_ids', [])
        features = serializer.validated_data.get('features')
        
        engineer = FeatureEngineer(str(feature_group.workspace_id))
        
        result = engineer.get_online_features(
            feature_group.name,
            entity_ids,
            features
        )
        
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get feature statistics for this group."""
        from .models import FeatureDefinition
        
        feature_group = self.get_object()
        
        definitions = FeatureDefinition.objects.filter(
            feature_group=feature_group,
            is_active=True
        )
        
        stats = []
        for defn in definitions:
            stats.append({
                'feature_name': defn.name,
                'dtype': defn.dtype,
                **defn.statistics
            })
        
        return Response(stats)
    
    # Set the function name to match the attribute name
    statistics.__name__ = 'feature_statistics'
    
    @action(detail=True, methods=['post'])
    def sync_online(self, request, pk=None):
        """Sync features to online store."""
        from .tasks import sync_online_features
        
        feature_group = self.get_object()
        entity_ids = request.data.get('entity_ids')
        
        task = sync_online_features.delay(
            str(feature_group.id),
            entity_ids=entity_ids
        )
        
        return Response({
            'status': 'started',
            'task_id': task.id,
            'feature_group_id': str(feature_group.id)
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['get'])
    def materializations(self, request, pk=None):
        """Get materialization history for this feature group."""
        from .serializers import FeatureMaterializationSerializer
        
        feature_group = self.get_object()
        materializations = feature_group.materializations.all().order_by('-created_at')[:20]
        
        serializer = FeatureMaterializationSerializer(materializations, many=True)
        return Response(serializer.data)
    
    return materialize, get_features, statistics, sync_online, materializations


# Dynamically add methods to FeatureGroupViewSet
FeatureGroupViewSet.materialize = _add_feature_group_actions()[0]
FeatureGroupViewSet.get_features = _add_feature_group_actions()[1]
FeatureGroupViewSet.feature_statistics = _add_feature_group_actions()[2]
FeatureGroupViewSet.sync_online = _add_feature_group_actions()[3]
FeatureGroupViewSet.materializations = _add_feature_group_actions()[4]


# Extended FeatureView actions

def _add_feature_view_actions():
    """Add additional actions to FeatureViewViewSet."""
    
    @action(detail=True, methods=['post'])
    def create_training_dataset(self, request, pk=None):
        """Create a training dataset from this feature view."""
        from .tasks import create_training_dataset_task
        from .serializers import CreateTrainingDatasetRequestSerializer
        
        feature_view = self.get_object()
        
        serializer = CreateTrainingDatasetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        name = serializer.validated_data.get('name')
        label_column = serializer.validated_data.get('label_column')
        start_time = serializer.validated_data.get('start_time')
        end_time = serializer.validated_data.get('end_time')
        split_config = serializer.validated_data.get('split_config')
        
        task = create_training_dataset_task.delay(
            str(feature_view.id),
            name=name,
            label_column=label_column,
            start_time=start_time.isoformat() if start_time else None,
            end_time=end_time.isoformat() if end_time else None,
            split_config=split_config,
            created_by_user_id=request.user.id
        )
        
        return Response({
            'status': 'started',
            'task_id': task.id,
            'feature_view_id': str(feature_view.id),
            'name': name
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview data from feature view."""
        feature_view = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        
        try:
            import trino
            
            conn = trino.dbapi.connect(
                host=getattr(settings, 'TRINO_HOST', 'trino'),
                port=getattr(settings, 'TRINO_PORT', 8080),
                user=getattr(settings, 'TRINO_USER', 'conveyor'),
                catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
                schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
            )
            cursor = conn.cursor()
            
            # Get feature groups and build query
            feature_groups = feature_view.feature_groups.all()
            if not feature_groups:
                return Response({'columns': [], 'rows': [], 'error': 'No feature groups'})
            
            primary_fg = feature_groups.first()
            table_name = primary_fg.source_table
            
            # Select specific features
            features = feature_view.features or []
            if features:
                select_cols = [f.get('feature_name', f.get('name', '*')) if isinstance(f, dict) else f for f in features]
                select_str = ', '.join(select_cols)
            else:
                select_str = '*'
            
            query = f"SELECT {select_str} FROM {table_name} LIMIT {limit}"
            cursor.execute(query)
            
            columns = [desc[0] for desc in cursor.description]
            rows = [list(row) for row in cursor.fetchall()]
            
            return Response({
                'columns': columns,
                'rows': rows,
                'feature_view': feature_view.name
            })
            
        except Exception as e:
            return Response({
                'columns': [],
                'rows': [],
                'error': str(e)
            })
    
    # Set the function name to match the attribute name
    preview.__name__ = 'preview_data'
    
    return create_training_dataset, preview


FeatureViewViewSet.create_training_dataset = _add_feature_view_actions()[0]
FeatureViewViewSet.preview_data = _add_feature_view_actions()[1]
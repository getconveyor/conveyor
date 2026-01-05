"""
URL configuration for data_science app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExperimentViewSet,
    ExperimentRunViewSet,
    MLModelViewSet,
    ModelVersionViewSet,
    FeatureGroupViewSet,
    FeatureViewViewSet,
    TrainingDatasetViewSet,
)

router = DefaultRouter()
router.register(r'experiments', ExperimentViewSet, basename='experiments')
router.register(r'runs', ExperimentRunViewSet, basename='experiment-runs')
router.register(r'models', MLModelViewSet, basename='ml-models')
router.register(r'versions', ModelVersionViewSet, basename='model-versions')
router.register(r'feature-groups', FeatureGroupViewSet, basename='feature-groups')
router.register(r'feature-views', FeatureViewViewSet, basename='feature-views')
router.register(r'training-datasets', TrainingDatasetViewSet, basename='training-datasets')

urlpatterns = [
    path('', include(router.urls)),
]

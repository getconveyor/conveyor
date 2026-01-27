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
    FeatureDefinitionViewSet,
    FeatureEngineeringJobViewSet,
    FeatureEngineeringRunViewSet,
    FeatureMaterializationViewSet,
    OnlineFeatureStoreViewSet,
)

router = DefaultRouter()
router.register(r'experiments', ExperimentViewSet, basename='experiments')
router.register(r'runs', ExperimentRunViewSet, basename='experiment-runs')
router.register(r'models', MLModelViewSet, basename='ml-models')
router.register(r'versions', ModelVersionViewSet, basename='model-versions')
router.register(r'feature-groups', FeatureGroupViewSet, basename='feature-groups')
router.register(r'feature-views', FeatureViewViewSet, basename='feature-views')
router.register(r'training-datasets', TrainingDatasetViewSet, basename='training-datasets')
router.register(r'feature-definitions', FeatureDefinitionViewSet, basename='feature-definitions')
router.register(r'feature-engineering-jobs', FeatureEngineeringJobViewSet, basename='feature-engineering-jobs')
router.register(r'feature-engineering-runs', FeatureEngineeringRunViewSet, basename='feature-engineering-runs')
router.register(r'materializations', FeatureMaterializationViewSet, basename='materializations')
router.register(r'online-stores', OnlineFeatureStoreViewSet, basename='online-stores')

urlpatterns = [
    path('', include(router.urls)),
]

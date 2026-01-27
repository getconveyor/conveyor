"""
URL configuration for governance app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DataAssetViewSet,
    DataLineageViewSet,
    DataQualityRuleViewSet,
    DataQualityResultViewSet,
    GlossaryTermViewSet,
    PolicyViewSet,
)

router = DefaultRouter()
router.register(r'assets', DataAssetViewSet, basename='data-assets')
router.register(r'lineage', DataLineageViewSet, basename='data-lineage')
router.register(r'quality-rules', DataQualityRuleViewSet, basename='quality-rules')
router.register(r'quality-results', DataQualityResultViewSet, basename='quality-results')
router.register(r'glossary', GlossaryTermViewSet, basename='glossary')
router.register(r'policies', PolicyViewSet, basename='policies')

urlpatterns = [
    path('', include(router.urls)),
]

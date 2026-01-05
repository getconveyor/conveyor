"""
URL configuration for monitoring app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SystemHealthViewSet,
    AlertViewSet,
    AuditLogViewSet,
    MetricSnapshotViewSet,
    GlobalSearchView,
)

router = DefaultRouter()
router.register(r'health', SystemHealthViewSet, basename='system-health')
router.register(r'alerts', AlertViewSet, basename='alerts')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'metrics', MetricSnapshotViewSet, basename='metrics')
router.register(r'search', GlobalSearchView, basename='global-search')

urlpatterns = [
    path('', include(router.urls)),
]

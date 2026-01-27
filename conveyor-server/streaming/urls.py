"""
URL configuration for streaming app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StreamSourceViewSet,
    StreamPipelineViewSet,
    StreamEventViewSet,
    StreamAlertViewSet,
    StreamDashboardViewSet,
)

router = DefaultRouter()
router.register(r'sources', StreamSourceViewSet, basename='stream-sources')
router.register(r'pipelines', StreamPipelineViewSet, basename='stream-pipelines')
router.register(r'events', StreamEventViewSet, basename='stream-events')
router.register(r'alerts', StreamAlertViewSet, basename='stream-alerts')
router.register(r'dashboard', StreamDashboardViewSet, basename='stream-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

"""
URL configuration for analytics app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardViewSet,
    WidgetViewSet,
    SavedQueryViewSet,
    ReportViewSet,
    ReportExecutionViewSet,
    ExplorationViewSet,
)

router = DefaultRouter()
router.register(r'dashboards', DashboardViewSet, basename='dashboards')
router.register(r'widgets', WidgetViewSet, basename='widgets')
router.register(r'queries', SavedQueryViewSet, basename='saved-queries')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'executions', ReportExecutionViewSet, basename='report-executions')
router.register(r'explorations', ExplorationViewSet, basename='explorations')

urlpatterns = [
    path('', include(router.urls)),
]

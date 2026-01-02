from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SourceViewSet,
    # DataSourceViewSet,
    PipelineViewSet,
    PipelineRunViewSet,
    ScheduleViewSet
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'sources', SourceViewSet, basename='source')
# router.register(r'data-sources', DataSourceViewSet, basename='datasource')
router.register(r'pipelines', PipelineViewSet, basename='pipeline')
router.register(r'pipeline-runs', PipelineRunViewSet, basename='pipelinerun')
router.register(r'schedules', ScheduleViewSet, basename='schedule')

app_name = 'integration'

urlpatterns = [
    path('', include(router.urls)),
]

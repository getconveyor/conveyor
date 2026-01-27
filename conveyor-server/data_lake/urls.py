from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FileViewSet, FolderViewSet, SchemaViewSet,
    StorageZoneViewSet, StorageStatsViewSet
)

router = DefaultRouter()
router.register(r'files', FileViewSet, basename='datalake-file')
router.register(r'folders', FolderViewSet, basename='datalake-folder')
router.register(r'schemas', SchemaViewSet, basename='datalake-schema')
router.register(r'storage-zones', StorageZoneViewSet, basename='datalake-storage-zone')
router.register(r'stats', StorageStatsViewSet, basename='datalake-stats')

app_name = 'data_lake'

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrinoQueryViewSet, QueryHistoryViewSet, CatalogViewSet

router = DefaultRouter()
router.register(r'queries', TrinoQueryViewSet, basename='trino-query')
router.register(r'history', QueryHistoryViewSet, basename='query-history')
router.register(r'catalogs', CatalogViewSet, basename='catalog')

urlpatterns = [
    path('', include(router.urls)),
]

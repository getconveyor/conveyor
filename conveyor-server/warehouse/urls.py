from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrinoQueryViewSet, QueryHistoryViewSet, NamespaceViewSet

router = DefaultRouter()
router.register(r'queries', TrinoQueryViewSet, basename='trino-query')
router.register(r'history', QueryHistoryViewSet, basename='query-history')
router.register(r'namespaces', NamespaceViewSet, basename='namespace')

urlpatterns = [
    path('', include(router.urls)),
]

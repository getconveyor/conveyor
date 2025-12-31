from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransformationViewSet,
    TransformationRuleViewSet,
    DataQualityCheckViewSet,
    DataQualityResultViewSet
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'transformations', TransformationViewSet, basename='transformation')
router.register(r'transformation-rules', TransformationRuleViewSet, basename='transformation-rule')
router.register(r'quality-checks', DataQualityCheckViewSet, basename='quality-check')
router.register(r'quality-results', DataQualityResultViewSet, basename='quality-result')

app_name = 'transformation'

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserViewSet,
    ApiKeyViewSet,
)
from .workspace_views import (
    WorkspaceViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'api-keys', ApiKeyViewSet, basename='api-key')
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Include router URLs
    path('', include(router.urls)),
]

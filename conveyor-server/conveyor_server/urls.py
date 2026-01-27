"""
URL configuration for conveyor_server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.cache import never_cache


@never_cache
@require_GET
def health_check(request):
    """Basic health check endpoint for load balancers and k8s probes."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'conveyor-server',
    })


urlpatterns = [
    # Health Check
    path('health/', health_check, name='health_check'),
    
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Authentication - JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # API Endpoints
    path('api/', include('authentication.urls')),
    path('api/integration/', include('integration.urls')),
    path('api/transformation/', include('transformation.urls')),
    path('api/data-lake/', include('data_lake.urls')),
    path('api/lakehouse/', include('warehouse.urls')),
    path('api/streaming/', include('streaming.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/data-science/', include('data_science.urls')),
    path('api/governance/', include('governance.urls')),
    path('api/monitoring/', include('monitoring.urls')),

    # DRF Browsable API auth (for development)
    path('api-auth/', include('rest_framework.urls')),
    
    # Prometheus metrics (django-prometheus)
    path('', include('django_prometheus.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

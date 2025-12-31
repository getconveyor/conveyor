"""
WebSocket URL routing for the Conveyor platform.

This module aggregates WebSocket routes from all Django apps.
"""

from django.urls import path

# Import WebSocket URL patterns from apps
# Note: integration.routing will be created in Phase 10
# For now, we'll create an empty list to avoid import errors

websocket_urlpatterns = []

# Import and add integration WebSocket routes
from integration.routing import websocket_urlpatterns as integration_websockets
websocket_urlpatterns.extend(integration_websockets)

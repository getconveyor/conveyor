"""
WebSocket URL routing for the integration app.

Defines WebSocket endpoints for real-time pipeline updates.
"""

from django.urls import re_path
from integration.consumers import PipelineConsumer, WorkspaceConsumer

websocket_urlpatterns = [
    # Pipeline-specific updates
    # ws://host/ws/pipelines/<pipeline_id>/
    re_path(
        r'ws/pipelines/(?P<pipeline_id>[0-9a-f-]+)/$',
        PipelineConsumer.as_asgi()
    ),

    # Workspace-level updates
    # ws://host/ws/workspace/<workspace_id>/
    re_path(
        r'ws/workspace/(?P<workspace_id>[0-9a-f-]+)/$',
        WorkspaceConsumer.as_asgi()
    ),
]

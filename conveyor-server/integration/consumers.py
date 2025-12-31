"""
WebSocket consumers for real-time pipeline updates.

This module provides WebSocket consumers that broadcast pipeline execution
progress and status updates to connected clients.
"""

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class PipelineConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for pipeline-specific updates.

    Clients connect to: ws://host/ws/pipelines/{pipeline_id}/

    They will receive real-time updates about pipeline execution:
    - Status changes (running, completed, failed)
    - Progress updates (0-100%)
    - Current step/message
    - Records processed count
    - Error messages
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.pipeline_id = self.scope['url_route']['kwargs']['pipeline_id']
        self.room_group_name = f'pipeline_{self.pipeline_id}'

        # Join pipeline group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        logger.info(f"WebSocket connected to pipeline {self.pipeline_id}")

        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'pipeline_id': self.pipeline_id,
            'message': 'Connected to pipeline updates'
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave pipeline group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        logger.info(f"WebSocket disconnected from pipeline {self.pipeline_id}")

    async def receive(self, text_data):
        """
        Handle messages from WebSocket client.

        Currently not used, but could be used for:
        - Requesting current status
        - Pausing/resuming pipeline
        - Canceling pipeline
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))

            elif message_type == 'request_status':
                # Could fetch current pipeline run status from database
                # and send it back
                pass

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received from client: {text_data}")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")

    async def pipeline_update(self, event):
        """
        Handle pipeline update events from the channel layer.

        This method is called when broadcast_pipeline_update() sends
        a message to the group.

        Args:
            event: Dictionary with update data
        """
        # Send update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'pipeline_update',
            'pipeline_id': event.get('pipeline_id'),
            'status': event.get('status'),
            'progress': event.get('progress'),
            'step': event.get('step'),
            'message': event.get('message'),
            'records_processed': event.get('records_processed'),
            'error_count': event.get('error_count'),
            'error_message': event.get('error_message'),
            'timestamp': event.get('timestamp')
        }))


class WorkspaceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for workspace-level updates.

    Clients connect to: ws://host/ws/workspace/{workspace_id}/

    They will receive updates about all pipelines in the workspace:
    - Pipeline started/completed/failed
    - Schedule changes
    - Connection updates
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.room_group_name = f'workspace_{self.workspace_id}'

        # Join workspace group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        logger.info(f"WebSocket connected to workspace {self.workspace_id}")

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'workspace_id': self.workspace_id,
            'message': 'Connected to workspace updates'
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        logger.info(f"WebSocket disconnected from workspace {self.workspace_id}")

    async def workspace_update(self, event):
        """Handle workspace update events."""
        await self.send(text_data=json.dumps({
            'type': 'workspace_update',
            'workspace_id': event.get('workspace_id'),
            'event_type': event.get('event_type'),
            'data': event.get('data'),
            'timestamp': event.get('timestamp')
        }))


# Helper functions for broadcasting updates

def broadcast_pipeline_update(
    pipeline_id: str,
    status: str,
    progress: int,
    step: str,
    message: str,
    records_processed: Optional[int] = None,
    error_count: Optional[int] = None,
    error_message: Optional[str] = None
):
    """
    Broadcast a pipeline update to all connected WebSocket clients.

    This function is called from Celery tasks to send real-time updates.

    Args:
        pipeline_id: Pipeline UUID
        status: Pipeline status (running, completed, failed, etc.)
        progress: Progress percentage (0-100)
        step: Current step description
        message: Status message
        records_processed: Number of records processed (optional)
        error_count: Number of errors (optional)
        error_message: Error message if failed (optional)

    Example:
        >>> broadcast_pipeline_update(
        ...     pipeline_id='123e4567-e89b-12d3-a456-426614174000',
        ...     status='running',
        ...     progress=50,
        ...     step='Processing data',
        ...     message='Processing stream: users'
        ... )
    """
    from datetime import datetime

    channel_layer = get_channel_layer()

    if not channel_layer:
        logger.warning("No channel layer configured, skipping WebSocket broadcast")
        return

    group_name = f'pipeline_{pipeline_id}'

    # Send update to the group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'pipeline_update',
            'pipeline_id': pipeline_id,
            'status': status,
            'progress': progress,
            'step': step,
            'message': message,
            'records_processed': records_processed,
            'error_count': error_count,
            'error_message': error_message,
            'timestamp': datetime.utcnow().isoformat()
        }
    )

    logger.debug(f"Broadcast update to {group_name}: {progress}% - {message}")


def broadcast_workspace_update(
    workspace_id: str,
    event_type: str,
    data: Dict[str, Any]
):
    """
    Broadcast a workspace-level update to all connected clients.

    Args:
        workspace_id: Workspace UUID
        event_type: Type of event (pipeline_started, pipeline_completed, etc.)
        data: Event data

    Example:
        >>> broadcast_workspace_update(
        ...     workspace_id='123e4567-e89b-12d3-a456-426614174000',
        ...     event_type='pipeline_started',
        ...     data={'pipeline_id': '...', 'name': 'Daily Sync'}
        ... )
    """
    from datetime import datetime

    channel_layer = get_channel_layer()

    if not channel_layer:
        logger.warning("No channel layer configured, skipping WebSocket broadcast")
        return

    group_name = f'workspace_{workspace_id}'

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'workspace_update',
            'workspace_id': workspace_id,
            'event_type': event_type,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }
    )

    logger.debug(f"Broadcast workspace update: {event_type}")

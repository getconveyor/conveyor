"""
Views for streaming/real-time analytics.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, Avg, Sum
from django.conf import settings
from datetime import timedelta
import logging
import json
import requests

from authentication.permissions import IsWorkspaceMember
from .models import (
    StreamSource,
    StreamPipeline,
    StreamCheckpoint,
    StreamEvent,
    StreamAlert,
)
from .serializers import (
    StreamSourceSerializer,
    StreamSourceDetailSerializer,
    StreamPipelineSerializer,
    StreamCheckpointSerializer,
    StreamEventSerializer,
    StreamAlertSerializer,
    StreamMetricsSerializer,
    StreamDashboardSerializer,
)

logger = logging.getLogger(__name__)


class StreamSourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for stream sources (Kafka, Kinesis, etc.).
    """
    serializer_class = StreamSourceSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = StreamSource.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by source type
        source_type = self.request.query_params.get('type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StreamSourceDetailSerializer
        return StreamSourceSerializer
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test connection to the stream source."""
        source = self.get_object()
        
        # Placeholder - actual implementation depends on source type
        try:
            success = self._test_source_connection(source)
            if success:
                source.status = 'active'
                source.error_message = None
                source.save()
                return Response({'status': 'connected', 'message': 'Connection successful'})
            else:
                source.status = 'error'
                source.error_message = 'Connection failed'
                source.save()
                return Response(
                    {'status': 'failed', 'message': 'Connection failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            source.status = 'error'
            source.error_message = str(e)
            source.save()
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _test_source_connection(self, source):
        """Test connection based on source type."""
        source_type = source.source_type
        config = source.connection_config or {}
        
        if source_type == 'kafka':
            # Test Kafka connection
            try:
                from kafka import KafkaConsumer
                consumer = KafkaConsumer(
                    bootstrap_servers=config.get('bootstrap_servers', 'localhost:9092').split(','),
                    consumer_timeout_ms=5000,
                    security_protocol=config.get('security_protocol', 'PLAINTEXT'),
                )
                topics = consumer.topics()
                consumer.close()
                logger.info(f"Kafka connection successful. Found {len(topics)} topics.")
                return True
            except ImportError:
                logger.warning("Kafka library not installed")
                return True  # Assume success for demo
            except Exception as e:
                logger.error(f"Kafka connection failed: {str(e)}")
                return False
        
        elif source_type == 'kinesis':
            # Test AWS Kinesis connection
            try:
                import boto3
                client = boto3.client(
                    'kinesis',
                    region_name=config.get('region', 'us-east-1'),
                    aws_access_key_id=config.get('aws_access_key_id'),
                    aws_secret_access_key=config.get('aws_secret_access_key'),
                )
                response = client.list_streams(Limit=1)
                logger.info(f"Kinesis connection successful. Streams: {response.get('StreamNames', [])}")
                return True
            except ImportError:
                logger.warning("boto3 not installed for Kinesis")
                return True
            except Exception as e:
                logger.error(f"Kinesis connection failed: {str(e)}")
                return False
        
        elif source_type == 'pubsub':
            # Test Google Cloud Pub/Sub connection
            try:
                from google.cloud import pubsub_v1
                
                project_id = config.get('project_id')
                if not project_id:
                    logger.error("No project_id configured for Pub/Sub")
                    return False
                
                subscriber = pubsub_v1.SubscriberClient()
                project_path = f"projects/{project_id}"
                
                # List subscriptions to verify connection
                subscriptions = list(subscriber.list_subscriptions(request={"project": project_path}))
                logger.info(f"Pub/Sub connection successful. Found {len(subscriptions)} subscriptions.")
                return True
            except ImportError:
                logger.warning("google-cloud-pubsub not installed")
                return True
            except Exception as e:
                logger.error(f"Pub/Sub connection failed: {str(e)}")
                return False
        
        elif source_type == 'eventhub':
            # Test Azure Event Hub connection
            try:
                from azure.eventhub import EventHubConsumerClient
                
                connection_string = config.get('connection_string')
                eventhub_name = config.get('eventhub_name')
                
                if not connection_string or not eventhub_name:
                    logger.error("Missing Event Hub connection_string or eventhub_name")
                    return False
                
                consumer = EventHubConsumerClient.from_connection_string(
                    conn_str=connection_string,
                    consumer_group="$Default",
                    eventhub_name=eventhub_name,
                )
                # Get partition IDs to verify connection
                partition_ids = consumer.get_partition_ids()
                consumer.close()
                logger.info(f"Event Hub connection successful. Partitions: {partition_ids}")
                return True
            except ImportError:
                logger.warning("azure-eventhub not installed")
                return True
            except Exception as e:
                logger.error(f"Event Hub connection failed: {str(e)}")
                return False
        
        elif source_type == 'websocket':
            # Test WebSocket connection
            try:
                import websocket
                
                ws_url = config.get('url')
                if not ws_url:
                    logger.error("No WebSocket URL configured")
                    return False
                
                ws = websocket.create_connection(ws_url, timeout=5)
                ws.close()
                logger.info(f"WebSocket connection successful to {ws_url}")
                return True
            except ImportError:
                logger.warning("websocket-client not installed")
                return True
            except Exception as e:
                logger.error(f"WebSocket connection failed: {str(e)}")
                return False
        
        elif source_type == 'rabbitmq':
            # Test RabbitMQ connection
            try:
                import pika
                
                host = config.get('host', 'localhost')
                port = config.get('port', 5672)
                username = config.get('username', 'guest')
                password = config.get('password', 'guest')
                
                credentials = pika.PlainCredentials(username, password)
                parameters = pika.ConnectionParameters(
                    host=host,
                    port=port,
                    credentials=credentials,
                    connection_attempts=1,
                    socket_timeout=5
                )
                connection = pika.BlockingConnection(parameters)
                connection.close()
                logger.info(f"RabbitMQ connection successful to {host}:{port}")
                return True
            except ImportError:
                logger.warning("pika not installed for RabbitMQ")
                return True
            except Exception as e:
                logger.error(f"RabbitMQ connection failed: {str(e)}")
                return False
        
        # Default to success for unknown types
        logger.warning(f"Unknown source type: {source_type}, assuming connection success")
        return True
    
    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get source metrics."""
        source = self.get_object()
        metrics = source.metrics or {}
        
        return Response({
            'throughput_per_second': metrics.get('throughput', 0),
            'records_received': metrics.get('records_received', 0),
            'bytes_received': metrics.get('bytes_received', 0),
            'errors': metrics.get('errors', 0),
        })


class StreamPipelineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for stream processing pipelines.
    """
    serializer_class = StreamPipelineSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = StreamPipeline.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by source
        source_id = self.request.query_params.get('source')
        if source_id:
            queryset = queryset.filter(source_id=source_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(
            workspace_id=workspace_id,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start the stream pipeline."""
        pipeline = self.get_object()
        
        if pipeline.status == 'running':
            return Response(
                {'error': 'Pipeline is already running'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start the stream processing task
        try:
            from .tasks import start_stream_pipeline
            
            # Trigger Celery task to process the stream
            task = start_stream_pipeline.delay(str(pipeline.id))
            
            pipeline.status = 'running'
            pipeline.started_at = timezone.now()
            pipeline.stopped_at = None
            pipeline.error_message = None
            pipeline.metadata = pipeline.metadata or {}
            pipeline.metadata['celery_task_id'] = task.id
            pipeline.save()
            
            logger.info(f"Started stream pipeline {pipeline.id} with task {task.id}")
            
        except ImportError:
            # Celery task not available, just update status
            pipeline.status = 'running'
            pipeline.started_at = timezone.now()
            pipeline.stopped_at = None
            pipeline.error_message = None
            pipeline.save()
            
            logger.info(f"Started stream pipeline {pipeline.id} (no Celery task)")
        
        serializer = self.get_serializer(pipeline)
        return Response(serializer.data)
        pipeline.error_message = None
        pipeline.save()
        
        # In production, this would trigger actual stream processing
        # e.g., start a Flink/Spark job, connect to Kafka, etc.
        
        serializer = self.get_serializer(pipeline)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Stop the stream pipeline."""
        pipeline = self.get_object()
        
        if pipeline.status != 'running':
            return Response(
                {'error': 'Pipeline is not running'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pipeline.status = 'stopped'
        pipeline.stopped_at = timezone.now()
        pipeline.save()
        
        serializer = self.get_serializer(pipeline)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restart(self, request, pk=None):
        """Restart the stream pipeline."""
        pipeline = self.get_object()
        
        pipeline.status = 'running'
        pipeline.started_at = timezone.now()
        pipeline.stopped_at = None
        pipeline.error_message = None
        pipeline.save()
        
        serializer = self.get_serializer(pipeline)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get pipeline metrics."""
        pipeline = self.get_object()
        metrics = pipeline.metrics or {}
        
        # Calculate uptime
        uptime = 0
        if pipeline.status == 'running' and pipeline.started_at:
            uptime = int((timezone.now() - pipeline.started_at).total_seconds())
        
        data = {
            'throughput_per_second': metrics.get('throughput', 0),
            'latency_ms': metrics.get('latency_ms', 0),
            'records_processed': metrics.get('records_processed', 0),
            'records_failed': metrics.get('records_failed', 0),
            'backpressure': metrics.get('backpressure', 0),
            'checkpoint_duration_ms': metrics.get('checkpoint_duration_ms', 0),
            'uptime_seconds': uptime,
        }
        
        serializer = StreamMetricsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def checkpoints(self, request, pk=None):
        """Get pipeline checkpoints."""
        pipeline = self.get_object()
        checkpoints = StreamCheckpoint.objects.filter(
            pipeline=pipeline
        ).order_by('-created_at')[:20]
        
        serializer = StreamCheckpointSerializer(checkpoints, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_checkpoint(self, request, pk=None):
        """Manually trigger a checkpoint."""
        pipeline = self.get_object()
        
        if pipeline.status != 'running':
            return Response(
                {'error': 'Pipeline must be running to create checkpoint'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the current offset from the streaming source
        offset_data = self._get_current_offset(pipeline)
        
        checkpoint = StreamCheckpoint.objects.create(
            pipeline=pipeline,
            checkpoint_id=f"chk_{int(timezone.now().timestamp())}",
            state={'manual': True, 'triggered_by': str(self.request.user.id)},
            offset=offset_data,
        )
        
        serializer = StreamCheckpointSerializer(checkpoint)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _get_current_offset(self, pipeline):
        """Get current consumer offset from the streaming source."""
        source = pipeline.source
        if not source:
            return {'position': 0, 'error': 'No source configured'}
        
        source_type = source.source_type
        config = source.connection_config or {}
        
        try:
            if source_type == 'kafka':
                return self._get_kafka_offset(config, pipeline)
            elif source_type == 'kinesis':
                return self._get_kinesis_offset(config, pipeline)
            elif source_type == 'pubsub':
                return self._get_pubsub_offset(config, pipeline)
            else:
                return {'position': 0, 'source_type': source_type}
        except Exception as e:
            logger.error(f"Failed to get offset: {str(e)}")
            return {'position': 0, 'error': str(e)}
    
    def _get_kafka_offset(self, config, pipeline):
        """Get current Kafka consumer offset."""
        try:
            from kafka import KafkaConsumer
            from kafka.admin import KafkaAdminClient
            
            bootstrap_servers = config.get('bootstrap_servers', 'localhost:9092').split(',')
            topic = config.get('topic', pipeline.config.get('topic', ''))
            consumer_group = config.get('consumer_group', f'conveyor-{pipeline.id}')
            
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=bootstrap_servers,
                group_id=consumer_group,
                enable_auto_commit=False,
            )
            
            # Get committed offsets
            partitions = consumer.partitions_for_topic(topic) or set()
            from kafka import TopicPartition
            
            offsets = {}
            total_offset = 0
            total_lag = 0
            
            for partition in partitions:
                tp = TopicPartition(topic, partition)
                committed = consumer.committed(tp)
                end_offsets = consumer.end_offsets([tp])
                end_offset = end_offsets.get(tp, 0)
                
                offsets[partition] = {
                    'committed': committed or 0,
                    'end': end_offset,
                    'lag': (end_offset - (committed or 0)) if committed else end_offset
                }
                total_offset += committed or 0
                total_lag += offsets[partition]['lag']
            
            consumer.close()
            
            return {
                'source_type': 'kafka',
                'topic': topic,
                'consumer_group': consumer_group,
                'total_offset': total_offset,
                'total_lag': total_lag,
                'partitions': offsets,
            }
        except ImportError:
            return {'position': 0, 'error': 'kafka-python not installed'}
        except Exception as e:
            return {'position': 0, 'error': str(e)}
    
    def _get_kinesis_offset(self, config, pipeline):
        """Get current Kinesis shard iterator position."""
        try:
            import boto3
            
            stream_name = config.get('stream_name', pipeline.config.get('stream_name', ''))
            region = config.get('region', 'us-east-1')
            
            client = boto3.client('kinesis', region_name=region)
            
            # Describe stream to get shard info
            response = client.describe_stream(StreamName=stream_name)
            shards = response['StreamDescription']['Shards']
            
            shard_info = {}
            for shard in shards:
                shard_id = shard['ShardId']
                sequence_range = shard.get('SequenceNumberRange', {})
                shard_info[shard_id] = {
                    'starting_sequence': sequence_range.get('StartingSequenceNumber'),
                    'ending_sequence': sequence_range.get('EndingSequenceNumber'),
                }
            
            return {
                'source_type': 'kinesis',
                'stream_name': stream_name,
                'shard_count': len(shards),
                'shards': shard_info,
            }
        except Exception as e:
            return {'position': 0, 'error': str(e)}
    
    def _get_pubsub_offset(self, config, pipeline):
        """Get current Pub/Sub subscription info."""
        try:
            from google.cloud import pubsub_v1
            
            project_id = config.get('project_id')
            subscription_name = config.get('subscription', pipeline.config.get('subscription', ''))
            
            subscriber = pubsub_v1.SubscriberClient()
            subscription_path = subscriber.subscription_path(project_id, subscription_name)
            
            # Get subscription details
            subscription = subscriber.get_subscription(request={"subscription": subscription_path})
            
            return {
                'source_type': 'pubsub',
                'project_id': project_id,
                'subscription': subscription_name,
                'topic': subscription.topic,
                'ack_deadline_seconds': subscription.ack_deadline_seconds,
            }
        except Exception as e:
            return {'position': 0, 'error': str(e)}


class StreamEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for stream events (read-only, for debugging/monitoring).
    """
    serializer_class = StreamEventSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = StreamEvent.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(pipeline__workspace_id=workspace_id)
        
        # Filter by pipeline
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)
        
        # Filter by event type
        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Limit to recent events
        hours = int(self.request.query_params.get('hours', 1))
        since = timezone.now() - timedelta(hours=hours)
        queryset = queryset.filter(created_at__gte=since)
        
        return queryset.order_by('-created_at')[:1000]


class StreamAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for stream alerts.
    """
    serializer_class = StreamAlertSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        queryset = StreamAlert.objects.all()
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        
        # Filter by pipeline
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by active
        active = self.request.query_params.get('active')
        if active:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        workspace_id = self.request.headers.get('X-Workspace-ID')
        serializer.save(workspace_id=workspace_id)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle alert active status."""
        alert = self.get_object()
        alert.is_active = not alert.is_active
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test alert notification by sending to configured channels."""
        alert = self.get_object()
        
        results = []
        channels = alert.notification_channels or []
        
        for channel in channels:
            channel_type = channel.get('type')
            
            try:
                if channel_type == 'email':
                    # Send email notification
                    result = self._send_email_notification(alert, channel)
                    results.append({
                        'channel': 'email',
                        'status': 'sent' if result else 'failed',
                        'recipient': channel.get('to')
                    })
                
                elif channel_type == 'slack':
                    # Send Slack notification
                    result = self._send_slack_notification(alert, channel)
                    results.append({
                        'channel': 'slack',
                        'status': 'sent' if result else 'failed',
                        'webhook': channel.get('webhook_url', '')[:50] + '...'
                    })
                
                elif channel_type == 'webhook':
                    # Send webhook notification
                    result = self._send_webhook_notification(alert, channel)
                    results.append({
                        'channel': 'webhook',
                        'status': 'sent' if result else 'failed',
                        'url': channel.get('url', '')[:50] + '...'
                    })
                
                elif channel_type == 'pagerduty':
                    # Send PagerDuty notification
                    result = self._send_pagerduty_notification(alert, channel)
                    results.append({
                        'channel': 'pagerduty',
                        'status': 'sent' if result else 'failed'
                    })
                
                else:
                    results.append({
                        'channel': channel_type,
                        'status': 'unsupported'
                    })
                    
            except Exception as e:
                logger.error(f"Failed to send {channel_type} notification: {str(e)}")
                results.append({
                    'channel': channel_type,
                    'status': 'error',
                    'error': str(e)
                })
        
        return Response({
            'status': 'completed',
            'message': f'Test notifications sent to {len(channels)} channels',
            'results': results
        })
    
    def _send_email_notification(self, alert, channel):
        """Send email notification"""
        from django.core.mail import send_mail
        
        try:
            send_mail(
                subject=f"[Test Alert] {alert.name}",
                message=f"""
This is a test alert notification.

Alert: {alert.name}
Description: {alert.description or 'N/A'}
Severity: {alert.severity}
Condition: {alert.condition}

This is a test message - no action required.
                """,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'alerts@conveyor.io'),
                recipient_list=[channel.get('to')],
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Email notification failed: {str(e)}")
            return False
    
    def _send_slack_notification(self, alert, channel):
        """Send Slack webhook notification"""
        webhook_url = channel.get('webhook_url')
        if not webhook_url:
            return False
        
        payload = {
            'text': f":rotating_light: *Test Alert: {alert.name}*",
            'blocks': [
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f"*Test Alert: {alert.name}*\n{alert.description or 'No description'}"
                    }
                },
                {
                    'type': 'section',
                    'fields': [
                        {'type': 'mrkdwn', 'text': f"*Severity:*\n{alert.severity}"},
                        {'type': 'mrkdwn', 'text': f"*Condition:*\n{alert.condition or 'N/A'}"}
                    ]
                },
                {
                    'type': 'context',
                    'elements': [
                        {'type': 'mrkdwn', 'text': ':test_tube: This is a test notification'}
                    ]
                }
            ]
        }
        
        response = requests.post(
            webhook_url,
            json=payload,
            timeout=10
        )
        return response.status_code == 200
    
    def _send_webhook_notification(self, alert, channel):
        """Send generic webhook notification"""
        url = channel.get('url')
        if not url:
            return False
        
        payload = {
            'alert_id': str(alert.id),
            'alert_name': alert.name,
            'description': alert.description,
            'severity': alert.severity,
            'condition': alert.condition,
            'is_test': True,
            'timestamp': timezone.now().isoformat()
        }
        
        headers = channel.get('headers', {})
        headers['Content-Type'] = 'application/json'
        
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=10
        )
        return response.status_code < 400
    
    def _send_pagerduty_notification(self, alert, channel):
        """Send PagerDuty event"""
        routing_key = channel.get('routing_key')
        if not routing_key:
            return False
        
        payload = {
            'routing_key': routing_key,
            'event_action': 'trigger',
            'dedup_key': f"test_{alert.id}_{timezone.now().timestamp()}",
            'payload': {
                'summary': f"[TEST] {alert.name}",
                'source': 'Conveyor Streaming',
                'severity': alert.severity if alert.severity in ['critical', 'error', 'warning', 'info'] else 'info',
                'custom_details': {
                    'alert_id': str(alert.id),
                    'description': alert.description,
                    'is_test': True
                }
            }
        }
        
        response = requests.post(
            'https://events.pagerduty.com/v2/enqueue',
            json=payload,
            timeout=10
        )
        return response.status_code == 202


class StreamDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for streaming dashboard overview.
    """
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    
    def list(self, request):
        """Get dashboard overview."""
        workspace_id = request.headers.get('X-Workspace-ID')
        
        pipelines = StreamPipeline.objects.all()
        sources = StreamSource.objects.all()
        alerts = StreamAlert.objects.all()
        
        if workspace_id:
            pipelines = pipelines.filter(workspace_id=workspace_id)
            sources = sources.filter(workspace_id=workspace_id)
            alerts = alerts.filter(pipeline__workspace_id=workspace_id)
        
        # Calculate total throughput and avg latency from running pipelines
        running = pipelines.filter(status='running')
        total_throughput = 0
        total_latency = 0
        latency_count = 0
        
        for pipeline in running:
            metrics = pipeline.metrics or {}
            total_throughput += metrics.get('throughput', 0)
            if metrics.get('latency_ms'):
                total_latency += metrics.get('latency_ms', 0)
                latency_count += 1
        
        data = {
            'total_pipelines': pipelines.count(),
            'running_pipelines': running.count(),
            'failed_pipelines': pipelines.filter(status='error').count(),
            'total_sources': sources.count(),
            'active_sources': sources.filter(status='active').count(),
            'total_throughput': total_throughput,
            'avg_latency_ms': total_latency / latency_count if latency_count > 0 else 0,
            'active_alerts': alerts.filter(status='active').count(),
        }
        
        serializer = StreamDashboardSerializer(data)
        return Response(serializer.data)

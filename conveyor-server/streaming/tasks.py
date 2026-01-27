"""
Celery tasks for streaming pipeline processing.
"""

from celery import shared_task
from django.utils import timezone
import logging
import time
import json

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def start_stream_pipeline(self, pipeline_id):
    """
    Start processing a stream pipeline.
    
    This task connects to the source (Kafka, Kinesis, etc.) and processes
    incoming events according to the pipeline configuration.
    """
    from .models import StreamPipeline, StreamSource, StreamEvent, StreamCheckpoint
    
    try:
        pipeline = StreamPipeline.objects.get(id=pipeline_id)
        source = pipeline.source
        
        logger.info(f"Starting stream pipeline: {pipeline.name}")
        
        # Initialize metrics
        pipeline.metrics = pipeline.metrics or {}
        pipeline.metrics['records_processed'] = 0
        pipeline.metrics['records_failed'] = 0
        pipeline.metrics['throughput'] = 0
        pipeline.save()
        
        source_type = source.source_type
        config = source.connection_config or {}
        
        if source_type == 'kafka':
            process_kafka_stream(pipeline, source, config)
        elif source_type == 'kinesis':
            process_kinesis_stream(pipeline, source, config)
        elif source_type == 'pubsub':
            process_pubsub_stream(pipeline, source, config)
        elif source_type == 'webhook':
            # Webhook sources are push-based, no polling needed
            logger.info(f"Webhook pipeline {pipeline.id} ready to receive events")
        else:
            logger.warning(f"Unknown source type: {source_type}")
        
        return {'status': 'completed', 'pipeline_id': str(pipeline_id)}
        
    except StreamPipeline.DoesNotExist:
        logger.error(f"Pipeline {pipeline_id} not found")
        return {'status': 'error', 'message': 'Pipeline not found'}
    except Exception as e:
        logger.error(f"Pipeline {pipeline_id} failed: {str(e)}")
        
        # Update pipeline status
        try:
            pipeline = StreamPipeline.objects.get(id=pipeline_id)
            pipeline.status = 'error'
            pipeline.error_message = str(e)
            pipeline.save()
        except:
            pass
        
        raise self.retry(exc=e, countdown=60)


def process_kafka_stream(pipeline, source, config):
    """Process events from Kafka source"""
    from .models import StreamEvent, StreamCheckpoint
    
    try:
        from kafka import KafkaConsumer
        
        bootstrap_servers = config.get('bootstrap_servers', 'localhost:9092')
        topic = config.get('topic', 'default')
        group_id = config.get('group_id', f'conveyor-{pipeline.id}')
        
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers.split(','),
            group_id=group_id,
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')) if x else None,
            consumer_timeout_ms=1000  # Poll for 1 second
        )
        
        logger.info(f"Connected to Kafka: {bootstrap_servers}, topic: {topic}")
        
        records_processed = 0
        start_time = time.time()
        
        # Process messages until pipeline is stopped
        while True:
            pipeline.refresh_from_db()
            if pipeline.status != 'running':
                break
            
            messages = consumer.poll(timeout_ms=1000)
            
            for topic_partition, records in messages.items():
                for record in records:
                    try:
                        # Process the event
                        event_data = record.value
                        
                        # Apply transformations if configured
                        transformed_data = apply_transformations(
                            event_data,
                            pipeline.transformations
                        )
                        
                        # Store event
                        StreamEvent.objects.create(
                            pipeline=pipeline,
                            event_type=event_data.get('type', 'unknown'),
                            event_data=transformed_data,
                            source_offset=record.offset,
                            source_partition=record.partition,
                            source_timestamp=timezone.now()
                        )
                        
                        records_processed += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing Kafka message: {str(e)}")
                        pipeline.metrics['records_failed'] = pipeline.metrics.get('records_failed', 0) + 1
            
            # Update metrics
            elapsed = time.time() - start_time
            pipeline.metrics['records_processed'] = records_processed
            pipeline.metrics['throughput'] = records_processed / elapsed if elapsed > 0 else 0
            pipeline.save()
            
            # Create periodic checkpoint
            if records_processed > 0 and records_processed % 1000 == 0:
                StreamCheckpoint.objects.create(
                    pipeline=pipeline,
                    checkpoint_id=f"chk_{int(time.time())}",
                    offset={'records_processed': records_processed},
                    state={'topic': topic, 'group_id': group_id}
                )
        
        consumer.close()
        logger.info(f"Kafka consumer closed, processed {records_processed} records")
        
    except ImportError:
        logger.error("kafka-python not installed")
        raise
    except Exception as e:
        logger.error(f"Kafka processing error: {str(e)}")
        raise


def process_kinesis_stream(pipeline, source, config):
    """Process events from AWS Kinesis source"""
    from .models import StreamEvent
    
    try:
        import boto3
        
        region = config.get('region', 'us-east-1')
        stream_name = config.get('stream_name')
        
        if not stream_name:
            raise ValueError("stream_name is required for Kinesis source")
        
        client = boto3.client('kinesis', region_name=region)
        
        # Get shard iterator
        response = client.describe_stream(StreamName=stream_name)
        shards = response['StreamDescription']['Shards']
        
        records_processed = 0
        start_time = time.time()
        
        for shard in shards:
            shard_iterator = client.get_shard_iterator(
                StreamName=stream_name,
                ShardId=shard['ShardId'],
                ShardIteratorType='LATEST'
            )['ShardIterator']
            
            while True:
                pipeline.refresh_from_db()
                if pipeline.status != 'running':
                    break
                
                response = client.get_records(
                    ShardIterator=shard_iterator,
                    Limit=100
                )
                
                for record in response['Records']:
                    try:
                        event_data = json.loads(record['Data'].decode('utf-8'))
                        
                        transformed_data = apply_transformations(
                            event_data,
                            pipeline.transformations
                        )
                        
                        StreamEvent.objects.create(
                            pipeline=pipeline,
                            event_type=event_data.get('type', 'kinesis_event'),
                            event_data=transformed_data,
                            source_offset=record['SequenceNumber'],
                            source_timestamp=record['ApproximateArrivalTimestamp']
                        )
                        
                        records_processed += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing Kinesis record: {str(e)}")
                        pipeline.metrics['records_failed'] = pipeline.metrics.get('records_failed', 0) + 1
                
                shard_iterator = response.get('NextShardIterator')
                if not shard_iterator:
                    break
                
                # Update metrics
                elapsed = time.time() - start_time
                pipeline.metrics['records_processed'] = records_processed
                pipeline.metrics['throughput'] = records_processed / elapsed if elapsed > 0 else 0
                pipeline.save()
                
                time.sleep(0.2)  # Kinesis rate limiting
        
        logger.info(f"Kinesis processing completed, {records_processed} records")
        
    except ImportError:
        logger.error("boto3 not installed")
        raise
    except Exception as e:
        logger.error(f"Kinesis processing error: {str(e)}")
        raise


def process_pubsub_stream(pipeline, source, config):
    """Process events from Google Pub/Sub source"""
    from .models import StreamEvent
    
    try:
        from google.cloud import pubsub_v1
        
        project_id = config.get('project_id')
        subscription_id = config.get('subscription_id')
        
        if not project_id or not subscription_id:
            raise ValueError("project_id and subscription_id are required for Pub/Sub source")
        
        subscriber = pubsub_v1.SubscriberClient()
        subscription_path = subscriber.subscription_path(project_id, subscription_id)
        
        records_processed = 0
        start_time = time.time()
        
        def callback(message):
            nonlocal records_processed
            
            try:
                event_data = json.loads(message.data.decode('utf-8'))
                
                transformed_data = apply_transformations(
                    event_data,
                    pipeline.transformations
                )
                
                StreamEvent.objects.create(
                    pipeline=pipeline,
                    event_type=event_data.get('type', 'pubsub_event'),
                    event_data=transformed_data,
                    source_offset=message.message_id,
                    source_timestamp=message.publish_time
                )
                
                records_processed += 1
                message.ack()
                
            except Exception as e:
                logger.error(f"Error processing Pub/Sub message: {str(e)}")
                message.nack()
        
        streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
        
        try:
            streaming_pull_future.result(timeout=300)  # 5 minute timeout
        except TimeoutError:
            streaming_pull_future.cancel()
        
        logger.info(f"Pub/Sub processing completed, {records_processed} records")
        
    except ImportError:
        logger.error("google-cloud-pubsub not installed")
        raise
    except Exception as e:
        logger.error(f"Pub/Sub processing error: {str(e)}")
        raise


def apply_transformations(event_data, transformations):
    """Apply configured transformations to event data"""
    if not transformations:
        return event_data
    
    result = event_data.copy() if isinstance(event_data, dict) else event_data
    
    for transform in transformations:
        transform_type = transform.get('type')
        
        if transform_type == 'filter':
            # Filter fields
            fields = transform.get('fields', [])
            if fields:
                result = {k: v for k, v in result.items() if k in fields}
        
        elif transform_type == 'rename':
            # Rename fields
            mappings = transform.get('mappings', {})
            for old_name, new_name in mappings.items():
                if old_name in result:
                    result[new_name] = result.pop(old_name)
        
        elif transform_type == 'add_timestamp':
            # Add processing timestamp
            result['_processed_at'] = timezone.now().isoformat()
        
        elif transform_type == 'flatten':
            # Flatten nested objects
            result = flatten_dict(result)
        
        elif transform_type == 'mask':
            # Mask sensitive fields
            fields = transform.get('fields', [])
            for field in fields:
                if field in result:
                    result[field] = '***MASKED***'
    
    return result


def flatten_dict(d, parent_key='', sep='_'):
    """Flatten a nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


@shared_task
def check_stream_alerts():
    """
    Periodic task to check alert conditions for running pipelines.
    """
    from .models import StreamPipeline, StreamAlert
    
    # Get all active alerts
    alerts = StreamAlert.objects.filter(is_active=True)
    
    for alert in alerts:
        try:
            pipeline = alert.pipeline
            
            if not pipeline or pipeline.status != 'running':
                continue
            
            # Evaluate alert condition
            triggered = evaluate_alert_condition(alert, pipeline)
            
            if triggered:
                trigger_alert(alert, pipeline)
                
        except Exception as e:
            logger.error(f"Error checking alert {alert.id}: {str(e)}")


def evaluate_alert_condition(alert, pipeline):
    """Evaluate if alert condition is met"""
    condition = alert.condition or {}
    condition_type = condition.get('type')
    metrics = pipeline.metrics or {}
    
    if condition_type == 'throughput_low':
        threshold = condition.get('threshold', 0)
        current = metrics.get('throughput', 0)
        return current < threshold
    
    elif condition_type == 'throughput_high':
        threshold = condition.get('threshold', float('inf'))
        current = metrics.get('throughput', 0)
        return current > threshold
    
    elif condition_type == 'error_rate':
        threshold = condition.get('threshold', 0)
        processed = metrics.get('records_processed', 1)
        failed = metrics.get('records_failed', 0)
        error_rate = (failed / processed * 100) if processed > 0 else 0
        return error_rate > threshold
    
    elif condition_type == 'latency':
        threshold = condition.get('threshold', float('inf'))
        current = metrics.get('latency_ms', 0)
        return current > threshold
    
    return False


def trigger_alert(alert, pipeline):
    """Trigger alert and send notifications"""
    from .views import StreamAlertViewSet
    
    logger.warning(f"Alert triggered: {alert.name} for pipeline {pipeline.name}")
    
    # Update alert last triggered
    alert.last_triggered_at = timezone.now()
    alert.trigger_count = (alert.trigger_count or 0) + 1
    alert.save()
    
    # Send notifications
    view = StreamAlertViewSet()
    
    for channel in (alert.notification_channels or []):
        channel_type = channel.get('type')
        
        try:
            if channel_type == 'email':
                view._send_email_notification(alert, channel)
            elif channel_type == 'slack':
                view._send_slack_notification(alert, channel)
            elif channel_type == 'webhook':
                view._send_webhook_notification(alert, channel)
            elif channel_type == 'pagerduty':
                view._send_pagerduty_notification(alert, channel)
        except Exception as e:
            logger.error(f"Failed to send {channel_type} notification: {str(e)}")

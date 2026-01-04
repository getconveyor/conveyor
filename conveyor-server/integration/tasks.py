"""
Celery tasks for pipeline execution.

This module provides the main pipeline execution tasks that orchestrate:
- Connection testing
- Schema discovery
- Data extraction from sources
- Data transformation
- Data loading to destinations
- Real-time progress updates
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
from typing import Dict, Any, Optional, Iterator
import logging
import traceback
from datetime import datetime

from integration.models import Pipeline, PipelineRun, Source
from integration.connectors import ConnectorRegistry
from integration.lakehouse import LakehouseWriter
from integration.transformations import (
    ColumnMapper,
    RowFilter,
    create_column_mapper,
    create_row_filter
)
from integration.singer.messages import RecordMessage
from integration.singer.state import StateManager
from integration.exceptions import (
    ConveyorETLException,
    ConnectionError,
    ConnectorError
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='integration.run_pipeline')
def run_pipeline_task(self, pipeline_id: str, triggered_by_user_id: Optional[int] = None):
    """
    Main task to execute a pipeline.

    This task orchestrates the entire ETL process:
    1. Create/get PipelineRun record (5%)
    2. Test source connection (10%)
    3. Test destination connection (15%)
    4. Discover schema if needed (20%)
    5. For each stream (20% → 95%):
       - Read from source
       - Apply transformations
       - Write to destination
       - Update state
       - Broadcast progress
    6. Finalize and update metrics (100%)

    Args:
        pipeline_id: UUID of the pipeline to run
        triggered_by_user_id: ID of user who triggered the run (optional)

    Returns:
        Dictionary with execution results
    """
    pipeline_run = None

    try:
        # Step 1: Get pipeline and create run record (5%)
        logger.info(f"Starting pipeline execution: {pipeline_id}")

        pipeline = Pipeline.objects.select_related('source', 'destination').get(id=pipeline_id)

        # Create PipelineRun record
        pipeline_run = PipelineRun.objects.create(
            pipeline=pipeline,
            status='running',
            started_at=timezone.now(),
            celery_task_id=self.request.id,
            current_step='Initializing',
            progress=5,
            triggered_by_user_id=triggered_by_user_id
        )

        logger.info(f"Created pipeline run: {pipeline_run.id}")

        # Broadcast initial progress (will be implemented in Phase 10)
        _broadcast_progress(pipeline_run, 5, 'Initializing pipeline')

        # Step 2: Test source connection (10%)
        _broadcast_progress(pipeline_run, 10, 'Testing source connection')
        source_connector = ConnectorRegistry.create(pipeline.source)

        test_result = source_connector.test()
        if not test_result.success:
            raise ConnectionError(f"Source connection test failed: {test_result.message}")

        logger.info(f"Source connection test passed: {pipeline.source.name}")

        # Step 3: Check destination type and initialize writer (15%)
        _broadcast_progress(pipeline_run, 15, 'Initializing destination')

        config = pipeline.config or {}
        destination_type = config.get('destination_type')
        destination_connector = None
        lakehouse_writer = None

        if destination_type == 'lakehouse':
            # Initialize lakehouse writer
            logger.info("Using lakehouse destination")
            lakehouse_config = config.get('lakehouse', {})

            # Add environment credentials
            import os
            lakehouse_config['aws_access_key_id'] = os.getenv('MINIO_ROOT_USER', 'minioadmin')
            lakehouse_config['aws_secret_access_key'] = os.getenv('MINIO_ROOT_PASSWORD', 'minioadmin')

            lakehouse_writer = LakehouseWriter(lakehouse_config)
            logger.info(f"Lakehouse writer initialized for table: {lakehouse_writer.full_table_name}")
        else:
            # Use traditional destination connector
            logger.info("Using traditional destination connector")
            destination_connector = ConnectorRegistry.create(pipeline.destination)

            test_result = destination_connector.test()
            if not test_result.success:
                raise ConnectionError(f"Destination connection test failed: {test_result.message}")

            logger.info(f"Destination connection test passed: {pipeline.destination.name}")

        # Step 4: Get streams to sync (20%)
        _broadcast_progress(pipeline_run, 20, 'Preparing data streams')

        config = pipeline.config or {}
        streams = config.get('streams', [])

        if not streams:
            # If no streams configured, try to discover
            logger.info("No streams configured, attempting discovery")
            discovery = source_connector.discover()
            streams = [stream['name'] for stream in discovery.streams]

        if not streams:
            raise ValueError("No streams configured or discovered for this pipeline")

        logger.info(f"Found {len(streams)} streams to sync: {streams}")

        # Step 5: Process each stream (20% → 95%)
        total_records = 0
        total_errors = 0
        progress_per_stream = 75 / len(streams)
        current_progress = 20

        for i, stream_name in enumerate(streams):
            stream_progress_start = current_progress
            stream_progress_end = current_progress + progress_per_stream

            logger.info(f"Processing stream {i+1}/{len(streams)}: {stream_name}")
            _broadcast_progress(
                pipeline_run,
                int(stream_progress_start),
                f'Processing stream: {stream_name}'
            )

            try:
                # Get schema for stream
                discovery = source_connector.discover()
                stream_schema = discovery.schemas.get(stream_name, {})
                stream_info = next(
                    (s for s in discovery.streams if s['name'] == stream_name),
                    {}
                )
                key_properties = stream_info.get('key_properties', [])

                # Load state for incremental sync
                state_manager = StateManager(pipeline_run.state or {})
                stream_state = state_manager.get_bookmark(stream_name)

                # Read from source
                logger.info(f"Reading from source: {stream_name}")
                records = source_connector.read(
                    stream=stream_name,
                    schema=stream_schema,
                    state={'bookmarks': {stream_name: stream_state}} if stream_state else None
                )

                # Apply transformations
                records = _apply_transformations(records, config, stream_name)

                # Count records as they pass through
                records, record_count = _count_records(records)

                # Write to destination (lakehouse or traditional connector)
                if lakehouse_writer:
                    logger.info(f"Writing to lakehouse: {stream_name}")
                    write_stats = lakehouse_writer.write(
                        stream=stream_name,
                        schema=stream_schema,
                        records=records,
                        key_properties=key_properties
                    )
                else:
                    logger.info(f"Writing to destination: {stream_name}")
                    write_stats = destination_connector.write(
                        stream=stream_name,
                        schema=stream_schema,
                        records=records,
                        key_properties=key_properties
                    )

                total_records += write_stats.get('total_records', record_count)

                # Update state for incremental sync (save last sync timestamp)
                from datetime import datetime
                state_manager.set_bookmark(stream_name, 'last_sync_at', datetime.utcnow().isoformat())
                pipeline_run.state = state_manager.get_state()
                pipeline_run.save(update_fields=['state'])

                logger.info(
                    f"Stream {stream_name} complete: {write_stats.get('total_records', record_count)} records"
                )

            except Exception as e:
                logger.error(f"Error processing stream {stream_name}: {str(e)}")
                logger.error(traceback.format_exc())
                total_errors += 1
                # Continue with next stream

            current_progress = stream_progress_end

        # Step 6: Finalize (100%)
        _broadcast_progress(pipeline_run, 95, 'Finalizing pipeline')

        # Update pipeline run
        pipeline_run.status = 'completed' if total_errors == 0 else 'completed_with_errors'
        pipeline_run.completed_at = timezone.now()
        pipeline_run.records_processed = total_records
        pipeline_run.current_step = 'Completed'
        pipeline_run.progress = 100
        pipeline_run.error_count = total_errors
        pipeline_run.save()

        # Update pipeline last_run
        pipeline.last_run = timezone.now()
        pipeline.save()

        _broadcast_progress(pipeline_run, 100, 'Pipeline completed successfully')

        logger.info(
            f"Pipeline {pipeline_id} completed: {total_records} records, {total_errors} errors"
        )

        return {
            'success': True,
            'pipeline_run_id': str(pipeline_run.id),
            'records_processed': total_records,
            'errors': total_errors,
            'status': pipeline_run.status
        }

    except Exception as e:
        logger.error(f"Pipeline execution failed: {str(e)}")
        logger.error(traceback.format_exc())

        # Update pipeline run with error
        if pipeline_run:
            pipeline_run.status = 'failed'
            pipeline_run.completed_at = timezone.now()
            pipeline_run.error_message = str(e)
            pipeline_run.current_step = 'Failed'
            pipeline_run.save()

            _broadcast_progress(pipeline_run, pipeline_run.progress, f'Pipeline failed: {str(e)}')

        raise

    finally:
        # Cleanup connections
        if 'source_connector' in locals():
            source_connector.close()
        if 'destination_connector' in locals() and destination_connector:
            destination_connector.close()
        if 'lakehouse_writer' in locals() and lakehouse_writer:
            lakehouse_writer.close()


@shared_task(name='integration.test_connection')
def test_connection_task(connection_id: str):
    """
    Test a connection asynchronously.

    Args:
        connection_id: UUID of the connection to test

    Returns:
        Dictionary with test results
    """
    try:
        connection = Connection.objects.get(id=connection_id)
        connector = ConnectorRegistry.create(connection)

        result = connector.test()

        connector.close()

        return {
            'success': result.success,
            'message': result.message,
            'details': result.details
        }

    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return {
            'success': False,
            'message': f"Connection test failed: {str(e)}",
            'details': {'error': str(e)}
        }


@shared_task(name='integration.discover_schema')
def discover_schema_task(connection_id: str):
    """
    Discover schema asynchronously.

    Args:
        connection_id: UUID of the connection

    Returns:
        Dictionary with discovery results
    """
    try:
        connection = Connection.objects.get(id=connection_id)
        connector = ConnectorRegistry.create(connection)

        discovery = connector.discover()

        connector.close()

        return {
            'success': True,
            'streams': discovery.streams,
            'schemas': discovery.schemas
        }

    except Exception as e:
        logger.error(f"Schema discovery failed: {str(e)}")
        return {
            'success': False,
            'message': f"Schema discovery failed: {str(e)}",
            'error': str(e)
        }


def _apply_transformations(
    records: Iterator[RecordMessage],
    config: Dict[str, Any],
    stream_name: str
) -> Iterator[RecordMessage]:
    """
    Apply configured transformations to records.

    Args:
        records: Iterator of RecordMessage objects
        config: Pipeline configuration
        stream_name: Name of the stream

    Returns:
        Transformed record iterator
    """
    transformations = config.get('transformations', {})

    # Apply column mapping
    column_mapping = transformations.get('column_mapping', {}).get(stream_name)
    if column_mapping:
        logger.info(f"Applying column mapping to {stream_name}")
        mapper = ColumnMapper(column_mapping)
        records = mapper.transform(records)

    # Apply row filtering
    filters = transformations.get('filters', {}).get(stream_name)
    if filters:
        logger.info(f"Applying row filters to {stream_name}")
        conditions = filters.get('conditions', [])
        match_all = filters.get('match_all', True)
        row_filter = RowFilter(conditions, match_all)
        records = row_filter.transform(records)

    return records


def _count_records(records: Iterator[RecordMessage]) -> tuple:
    """
    Count records as they pass through.

    Args:
        records: Iterator of RecordMessage objects

    Returns:
        Tuple of (record iterator, count)
    """
    count = 0

    def counting_iterator():
        nonlocal count
        for record in records:
            count += 1
            yield record

    return counting_iterator(), count


def _broadcast_progress(
    pipeline_run: PipelineRun,
    progress: int,
    message: str
):
    """
    Broadcast pipeline progress update.

    Args:
        pipeline_run: PipelineRun instance
        progress: Progress percentage (0-100)
        message: Status message
    """
    # Update pipeline run
    pipeline_run.progress = progress
    pipeline_run.current_step = message
    pipeline_run.save(update_fields=['progress', 'current_step', 'updated_at'])

    # Broadcast via WebSocket
    from integration.consumers import broadcast_pipeline_update
    broadcast_pipeline_update(
        pipeline_id=str(pipeline_run.pipeline_id),
        status=pipeline_run.status,
        progress=progress,
        step=message,
        message=message,
        records_processed=pipeline_run.records_processed,
        error_count=pipeline_run.error_count
    )

    logger.info(f"Pipeline {pipeline_run.pipeline_id} progress: {progress}% - {message}")


@shared_task(name='integration.cleanup_old_runs')
def cleanup_old_runs_task(days: int = 30):
    """
    Clean up old pipeline runs.

    Args:
        days: Delete runs older than this many days

    Returns:
        Number of runs deleted
    """
    from datetime import timedelta

    cutoff_date = timezone.now() - timedelta(days=days)

    deleted_count = PipelineRun.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['completed', 'failed']
    ).delete()[0]

    logger.info(f"Cleaned up {deleted_count} old pipeline runs")

    return deleted_count

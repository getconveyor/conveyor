"""
Celery tasks for feature engineering and feature store operations.

This module provides async tasks for:
- Running feature engineering jobs
- Materializing features to stores
- Syncing online features
- Creating training datasets
"""

from celery import shared_task
from django.utils import timezone
from django.conf import settings
from typing import Optional, Dict, List
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='data_science.run_feature_engineering_job')
def run_feature_engineering_job(self, job_id: str, triggered_by_user_id: Optional[int] = None):
    """
    Execute a feature engineering job.
    
    This task orchestrates:
    1. Load source data from data lake (10%)
    2. Apply data preparation (30%)
    3. Apply feature transformations (60%)
    4. Compute statistics (70%)
    5. Write to offline store (85%)
    6. Sync to online store if enabled (95%)
    7. Update job metadata (100%)
    
    Args:
        job_id: UUID of the feature engineering job
        triggered_by_user_id: ID of user who triggered the run
    
    Returns:
        Dictionary with execution results
    """
    from .models import (
        FeatureEngineeringJob, 
        FeatureEngineeringRun,
        FeatureMaterialization
    )
    from .feature_engineering import FeatureEngineer
    
    run = None
    
    try:
        logger.info(f"Starting feature engineering job: {job_id}")
        
        # Get job
        job = FeatureEngineeringJob.objects.select_related(
            'target_feature_group'
        ).get(id=job_id)
        
        # Create run record
        run = FeatureEngineeringRun.objects.create(
            job=job,
            status='running',
            started_at=timezone.now(),
            celery_task_id=self.request.id,
            current_step='Initializing',
            progress_percent=5,
            triggered_by_id=triggered_by_user_id
        )
        
        # Initialize feature engineer
        engineer = FeatureEngineer(str(job.workspace_id))
        
        # Step 1: Load source data (10%)
        run.current_step = 'Loading source data'
        run.progress_percent = 10
        run.save()
        
        source_data = _load_source_data(job)
        run.rows_read = len(list(source_data.values())[0]) if source_data else 0
        run.save()
        
        logger.info(f"Loaded {run.rows_read} rows from source")
        
        # Step 2: Data preparation (30%)
        run.current_step = 'Preparing data'
        run.progress_percent = 30
        run.save()
        
        prepared_data = engineer.prepare_data(
            source_data,
            job.data_prep_config or {}
        )
        
        # Step 3: Feature engineering (60%)
        run.current_step = 'Engineering features'
        run.progress_percent = 60
        run.save()
        
        # Build feature definitions from job config
        feature_definitions = _build_feature_definitions(job)
        
        engineered_features = engineer.engineer_features(
            prepared_data,
            feature_definitions
        )
        
        run.rows_processed = len(list(engineered_features.values())[0]) if engineered_features else 0
        run.save()
        
        # Step 4: Compute statistics (70%)
        run.current_step = 'Computing statistics'
        run.progress_percent = 70
        run.save()
        
        statistics = engineer.compute_statistics(engineered_features)
        
        # Update feature definitions with statistics
        _update_feature_statistics(job.target_feature_group, statistics)
        
        # Step 5: Write to offline store (85%)
        run.current_step = 'Writing to offline store'
        run.progress_percent = 85
        run.save()
        
        entity_column = job.target_feature_group.entity_key
        
        offline_result = engineer.write_to_offline_store(
            engineered_features,
            str(job.target_feature_group_id),
            entity_column
        )
        
        if not offline_result.get('success'):
            raise Exception(f"Failed to write to offline store: {offline_result.get('error')}")
        
        run.rows_written = offline_result.get('rows_written', 0)
        run.save()
        
        # Create materialization record
        materialization = FeatureMaterialization.objects.create(
            feature_group=job.target_feature_group,
            engineering_run=run,
            store_type='offline',
            status='completed',
            started_at=run.started_at,
            completed_at=timezone.now(),
            rows_materialized=run.rows_written,
            features_materialized=len(engineered_features),
            offline_path=offline_result.get('table_name', '')
        )
        
        # Step 6: Sync to online store if enabled (95%)
        if job.target_feature_group.online_enabled:
            run.current_step = 'Syncing to online store'
            run.progress_percent = 95
            run.save()
            
            online_result = engineer.write_to_online_store(
                engineered_features,
                str(job.target_feature_group_id),
                entity_column,
                (job.target_feature_group.ttl_days or 7) * 86400
            )
            
            if online_result.get('success'):
                materialization.store_type = 'both'
                materialization.online_keys_updated = online_result.get('keys_updated', 0)
                materialization.save()
        
        # Step 7: Complete (100%)
        run.current_step = 'Completed'
        run.progress_percent = 100
        run.status = 'completed'
        run.completed_at = timezone.now()
        run.duration_seconds = int((run.completed_at - run.started_at).total_seconds())
        run.save()
        
        # Update job stats
        job.last_run_at = timezone.now()
        job.last_run_status = 'completed'
        job.last_run_duration_seconds = run.duration_seconds
        job.last_run_rows_processed = run.rows_processed
        job.total_runs += 1
        job.successful_runs += 1
        
        # Update watermark if incremental
        if job.is_incremental and job.watermark_column:
            watermark_values = engineered_features.get(job.watermark_column, [])
            if watermark_values:
                job.last_watermark = {'value': max(watermark_values)}
        
        job.save()
        
        logger.info(f"Feature engineering job completed successfully: {job_id}")
        
        return {
            'success': True,
            'run_id': str(run.id),
            'rows_read': run.rows_read,
            'rows_processed': run.rows_processed,
            'rows_written': run.rows_written,
            'features_generated': len(engineered_features),
            'duration_seconds': run.duration_seconds
        }
        
    except Exception as e:
        logger.error(f"Feature engineering job failed: {str(e)}")
        logger.error(traceback.format_exc())
        
        if run:
            run.status = 'failed'
            run.error_message = str(e)
            run.error_traceback = traceback.format_exc()
            run.completed_at = timezone.now()
            if run.started_at:
                run.duration_seconds = int((run.completed_at - run.started_at).total_seconds())
            run.save()
        
        # Update job error stats
        try:
            job = FeatureEngineeringJob.objects.get(id=job_id)
            job.last_run_at = timezone.now()
            job.last_run_status = 'failed'
            job.last_error_message = str(e)
            job.last_error_at = timezone.now()
            job.total_runs += 1
            job.failed_runs += 1
            job.status = 'error'
            job.save()
        except:
            pass
        
        return {
            'success': False,
            'error': str(e),
            'run_id': str(run.id) if run else None
        }


@shared_task(bind=True, name='data_science.materialize_features')
def materialize_features(
    self,
    feature_group_id: str,
    store_type: str = 'offline',
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
):
    """
    Materialize features for a feature group.
    
    Args:
        feature_group_id: UUID of the feature group
        store_type: 'offline', 'online', or 'both'
        start_time: Optional start of time range (ISO format)
        end_time: Optional end of time range (ISO format)
    
    Returns:
        Materialization result
    """
    from .models import FeatureGroup, FeatureMaterialization
    from .feature_engineering import FeatureEngineer
    
    logger.info(f"Materializing features for group: {feature_group_id}")
    
    materialization = None
    
    try:
        feature_group = FeatureGroup.objects.get(id=feature_group_id)
        
        # Create materialization record
        materialization = FeatureMaterialization.objects.create(
            feature_group=feature_group,
            store_type=store_type,
            status='running',
            started_at=timezone.now(),
            data_start_time=datetime.fromisoformat(start_time) if start_time else None,
            data_end_time=datetime.fromisoformat(end_time) if end_time else None
        )
        
        # Load data from source
        engineer = FeatureEngineer(str(feature_group.workspace_id))
        
        # Query existing features from offline store
        import trino
        
        conn = trino.dbapi.connect(
            host=getattr(settings, 'TRINO_HOST', 'trino'),
            port=getattr(settings, 'TRINO_PORT', 8080),
            user=getattr(settings, 'TRINO_USER', 'conveyor'),
            catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
            schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
        )
        cursor = conn.cursor()
        
        table_name = feature_group.source_table
        if not table_name:
            raise Exception("Feature group has no source table")
        
        # Build query
        query = f"SELECT * FROM {table_name}"
        conditions = []
        
        if start_time:
            conditions.append(f"event_timestamp >= TIMESTAMP '{start_time}'")
        if end_time:
            conditions.append(f"event_timestamp <= TIMESTAMP '{end_time}'")
        
        if conditions:
            query += f" WHERE {' AND '.join(conditions)}"
        
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        # Convert to dictionary
        features = {col: [] for col in columns}
        for row in rows:
            for i, col in enumerate(columns):
                features[col].append(row[i])
        
        materialization.rows_materialized = len(rows)
        materialization.features_materialized = len(columns)
        materialization.save()
        
        # Write to stores
        entity_column = feature_group.entity_key
        
        if store_type in ('offline', 'both'):
            offline_result = engineer.write_to_offline_store(
                features,
                feature_group_id,
                entity_column
            )
            materialization.offline_path = offline_result.get('table_name', '')
        
        if store_type in ('online', 'both'):
            online_result = engineer.write_to_online_store(
                features,
                feature_group_id,
                entity_column,
                (feature_group.ttl_days or 7) * 86400
            )
            materialization.online_keys_updated = online_result.get('keys_updated', 0)
        
        # Complete
        materialization.status = 'completed'
        materialization.completed_at = timezone.now()
        materialization.save()
        
        # Update feature group
        feature_group.last_updated_at = timezone.now()
        feature_group.row_count = len(rows)
        feature_group.save()
        
        logger.info(f"Materialization completed: {len(rows)} rows")
        
        return {
            'success': True,
            'materialization_id': str(materialization.id),
            'rows_materialized': len(rows),
            'store_type': store_type
        }
        
    except Exception as e:
        logger.error(f"Materialization failed: {str(e)}")
        
        if materialization:
            materialization.status = 'failed'
            materialization.error_message = str(e)
            materialization.completed_at = timezone.now()
            materialization.save()
        
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(bind=True, name='data_science.sync_online_features')
def sync_online_features(
    self,
    feature_group_id: str,
    entity_ids: Optional[List[str]] = None
):
    """
    Sync offline features to online store (Redis).
    
    Args:
        feature_group_id: UUID of the feature group
        entity_ids: Optional list of specific entity IDs to sync
    
    Returns:
        Sync result
    """
    from .models import FeatureGroup
    from .feature_engineering import FeatureEngineer
    
    logger.info(f"Syncing online features for group: {feature_group_id}")
    
    try:
        feature_group = FeatureGroup.objects.get(id=feature_group_id)
        
        if not feature_group.source_table:
            raise Exception("Feature group has no source table")
        
        engineer = FeatureEngineer(str(feature_group.workspace_id))
        
        # Query from offline store
        import trino
        
        conn = trino.dbapi.connect(
            host=getattr(settings, 'TRINO_HOST', 'trino'),
            port=getattr(settings, 'TRINO_PORT', 8080),
            user=getattr(settings, 'TRINO_USER', 'conveyor'),
            catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
            schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
        )
        cursor = conn.cursor()
        
        query = f"SELECT * FROM {feature_group.source_table}"
        
        if entity_ids:
            entity_key = feature_group.entity_key
            ids_str = ', '.join(f"'{eid}'" for eid in entity_ids)
            query += f" WHERE {entity_key} IN ({ids_str})"
        
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        # Convert to dictionary
        features = {col: [] for col in columns}
        for row in rows:
            for i, col in enumerate(columns):
                features[col].append(row[i])
        
        # Write to online store
        result = engineer.write_to_online_store(
            features,
            feature_group_id,
            feature_group.entity_key,
            (feature_group.ttl_days or 7) * 86400
        )
        
        # Update feature group
        feature_group.online_enabled = True
        feature_group.save()
        
        logger.info(f"Online sync completed: {result.get('keys_updated', 0)} keys")
        
        return {
            'success': True,
            'keys_updated': result.get('keys_updated', 0)
        }
        
    except Exception as e:
        logger.error(f"Online sync failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(bind=True, name='data_science.create_training_dataset')
def create_training_dataset_task(
    self,
    feature_view_id: str,
    name: str,
    label_column: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    split_config: Optional[Dict] = None,
    created_by_user_id: Optional[int] = None
):
    """
    Create a training dataset from a feature view.
    
    Args:
        feature_view_id: UUID of the feature view
        name: Name for the training dataset
        label_column: Target/label column name
        start_time: Start of time range (ISO format)
        end_time: End of time range (ISO format)
        split_config: Train/val/test split configuration
        created_by_user_id: ID of user creating the dataset
    
    Returns:
        Training dataset creation result
    """
    from .models import FeatureView
    from .feature_engineering import FeatureEngineer
    
    logger.info(f"Creating training dataset from view: {feature_view_id}")
    
    try:
        feature_view = FeatureView.objects.get(id=feature_view_id)
        
        engineer = FeatureEngineer(str(feature_view.workspace_id))
        
        result = engineer.create_training_dataset(
            feature_view_id=feature_view_id,
            name=name,
            label_column=label_column,
            start_time=datetime.fromisoformat(start_time) if start_time else None,
            end_time=datetime.fromisoformat(end_time) if end_time else None,
            split_config=split_config
        )
        
        if result.get('success') and created_by_user_id:
            from .models import TrainingDataset
            TrainingDataset.objects.filter(id=result['dataset_id']).update(
                created_by_id=created_by_user_id
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Training dataset creation failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(name='data_science.scheduled_feature_engineering')
def scheduled_feature_engineering():
    """
    Run scheduled feature engineering jobs.
    Called by Celery beat scheduler.
    """
    from .models import FeatureEngineeringJob
    from django.db.models import Q
    
    logger.info("Running scheduled feature engineering jobs")
    
    # Find active jobs with cron schedules
    jobs = FeatureEngineeringJob.objects.filter(
        status='active',
        schedule_type='cron'
    ).exclude(schedule_cron='')
    
    # For each job, check if it should run
    # This is a simplified implementation - in production use a proper
    # cron parser like croniter
    
    triggered = 0
    for job in jobs:
        try:
            # Trigger the job
            run_feature_engineering_job.delay(str(job.id))
            triggered += 1
            logger.info(f"Triggered scheduled job: {job.name}")
        except Exception as e:
            logger.error(f"Failed to trigger job {job.name}: {str(e)}")
    
    return {'triggered_jobs': triggered}


# Helper functions

def _load_source_data(job) -> Dict[str, List]:
    """Load source data for a feature engineering job."""
    import trino
    
    if job.source_query:
        query = job.source_query
    else:
        query = f"SELECT * FROM {job.source_table}"
        
        # Apply incremental filter if applicable
        if job.is_incremental and job.watermark_column and job.last_watermark:
            watermark_value = job.last_watermark.get('value')
            if watermark_value:
                query += f" WHERE {job.watermark_column} > '{watermark_value}'"
    
    conn = trino.dbapi.connect(
        host=getattr(settings, 'TRINO_HOST', 'trino'),
        port=getattr(settings, 'TRINO_PORT', 8080),
        user=getattr(settings, 'TRINO_USER', 'conveyor'),
        catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
        schema=getattr(settings, 'TRINO_SCHEMA', 'default'),
    )
    cursor = conn.cursor()
    cursor.execute(query)
    
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    # Convert to dictionary format
    data = {col: [] for col in columns}
    for row in rows:
        for i, col in enumerate(columns):
            data[col].append(row[i])
    
    return data


def _build_feature_definitions(job) -> List[Dict]:
    """Build feature definitions from job configuration."""
    from .models import FeatureDefinition
    
    definitions = []
    
    # First, use explicit feature definitions from the feature group
    feature_defs = FeatureDefinition.objects.filter(
        feature_group=job.target_feature_group,
        is_active=True
    ).order_by('order')
    
    for fd in feature_defs:
        definitions.append({
            'name': fd.name,
            'transform_type': fd.transform_type,
            'source_columns': fd.source_columns,
            'transform_config': fd.transform_config,
            'transformation_expression': fd.transformation_expression
        })
    
    # Also add any steps from the job's feature_engineering_steps
    for step in job.feature_engineering_steps or []:
        definitions.append({
            'name': step.get('name'),
            'transform_type': step.get('type', 'passthrough'),
            'source_columns': [step.get('source')] if step.get('source') else [],
            'transform_config': step.get('config', {}),
            'transformation_expression': step.get('expression', '')
        })
    
    return definitions


def _update_feature_statistics(feature_group, statistics: Dict):
    """Update feature definitions with computed statistics."""
    from .models import FeatureDefinition
    
    for feature_name, stats in statistics.items():
        FeatureDefinition.objects.filter(
            feature_group=feature_group,
            name=feature_name
        ).update(statistics=stats)

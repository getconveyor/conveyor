"""
Prometheus metrics configuration for Conveyor.

Provides application metrics for monitoring pipeline execution,
API performance, and system health.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from functools import wraps
import time
from typing import Callable, TypeVar, Any

T = TypeVar('T')

# =============================================================================
# Application Info
# =============================================================================

app_info = Info('conveyor', 'Conveyor application information')
app_info.info({
    'version': '1.0.0',
    'app': 'conveyor-server'
})

# =============================================================================
# Pipeline Metrics
# =============================================================================

pipeline_runs_total = Counter(
    'conveyor_pipeline_runs_total',
    'Total number of pipeline runs',
    ['pipeline_id', 'status', 'workspace_id']
)

pipeline_run_duration_seconds = Histogram(
    'conveyor_pipeline_run_duration_seconds',
    'Pipeline run duration in seconds',
    ['pipeline_id', 'workspace_id'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600]
)

pipeline_records_processed_total = Counter(
    'conveyor_pipeline_records_processed_total',
    'Total number of records processed by pipelines',
    ['pipeline_id', 'stream', 'workspace_id']
)

pipeline_records_failed_total = Counter(
    'conveyor_pipeline_records_failed_total',
    'Total number of records that failed processing',
    ['pipeline_id', 'stream', 'error_type', 'workspace_id']
)

active_pipeline_runs = Gauge(
    'conveyor_active_pipeline_runs',
    'Number of currently running pipelines',
    ['workspace_id']
)

pipeline_progress = Gauge(
    'conveyor_pipeline_progress',
    'Current progress of running pipelines (0-100)',
    ['pipeline_id', 'pipeline_run_id']
)

# =============================================================================
# Connector Metrics
# =============================================================================

connector_operations_total = Counter(
    'conveyor_connector_operations_total',
    'Total number of connector operations',
    ['connector_type', 'operation', 'status']
)

connector_operation_duration_seconds = Histogram(
    'conveyor_connector_operation_duration_seconds',
    'Connector operation duration in seconds',
    ['connector_type', 'operation'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60]
)

connector_connection_pool_size = Gauge(
    'conveyor_connector_connection_pool_size',
    'Current size of connector connection pools',
    ['connector_type']
)

# =============================================================================
# Circuit Breaker Metrics
# =============================================================================

circuit_breaker_state = Gauge(
    'conveyor_circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=half-open, 2=open)',
    ['circuit_name']
)

circuit_breaker_failures_total = Counter(
    'conveyor_circuit_breaker_failures_total',
    'Total number of circuit breaker failures',
    ['circuit_name']
)

circuit_breaker_successes_total = Counter(
    'conveyor_circuit_breaker_successes_total',
    'Total number of circuit breaker successes',
    ['circuit_name']
)

# =============================================================================
# Dead Letter Queue Metrics
# =============================================================================

dlq_records_total = Counter(
    'conveyor_dlq_records_total',
    'Total number of records added to dead letter queue',
    ['pipeline_id', 'stream', 'error_type']
)

dlq_size = Gauge(
    'conveyor_dlq_size',
    'Current size of dead letter queues',
    ['pipeline_id']
)

dlq_retries_total = Counter(
    'conveyor_dlq_retries_total',
    'Total number of DLQ retry attempts',
    ['pipeline_id', 'status']
)

# =============================================================================
# API Metrics
# =============================================================================

api_requests_total = Counter(
    'conveyor_api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status_code']
)

api_request_duration_seconds = Histogram(
    'conveyor_api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

api_rate_limit_hits_total = Counter(
    'conveyor_api_rate_limit_hits_total',
    'Total number of rate limit hits',
    ['endpoint', 'user_id']
)

# =============================================================================
# Lakehouse Metrics
# =============================================================================

lakehouse_writes_total = Counter(
    'conveyor_lakehouse_writes_total',
    'Total number of lakehouse write operations',
    ['layer', 'table', 'status']
)

lakehouse_write_duration_seconds = Histogram(
    'conveyor_lakehouse_write_duration_seconds',
    'Lakehouse write duration in seconds',
    ['layer', 'table'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
)

lakehouse_records_written_total = Counter(
    'conveyor_lakehouse_records_written_total',
    'Total number of records written to lakehouse',
    ['layer', 'table']
)

lakehouse_bytes_written_total = Counter(
    'conveyor_lakehouse_bytes_written_total',
    'Total bytes written to lakehouse',
    ['layer', 'table']
)

# =============================================================================
# Query Metrics
# =============================================================================

query_executions_total = Counter(
    'conveyor_query_executions_total',
    'Total number of query executions',
    ['catalog', 'status']
)

query_duration_seconds = Histogram(
    'conveyor_query_duration_seconds',
    'Query execution duration in seconds',
    ['catalog'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]
)

query_rows_returned = Histogram(
    'conveyor_query_rows_returned',
    'Number of rows returned by queries',
    ['catalog'],
    buckets=[1, 10, 100, 1000, 10000, 100000, 1000000]
)

# =============================================================================
# System Metrics
# =============================================================================

celery_tasks_total = Counter(
    'conveyor_celery_tasks_total',
    'Total number of Celery tasks',
    ['task_name', 'status']
)

celery_task_duration_seconds = Histogram(
    'conveyor_celery_task_duration_seconds',
    'Celery task duration in seconds',
    ['task_name'],
    buckets=[0.1, 0.5, 1, 5, 10, 30, 60, 300, 600, 1800]
)

cache_operations_total = Counter(
    'conveyor_cache_operations_total',
    'Total number of cache operations',
    ['operation', 'hit']
)

# =============================================================================
# Helper Functions
# =============================================================================

def track_pipeline_run(
    pipeline_id: str,
    workspace_id: str,
    status: str,
    duration: float,
    records_processed: int = 0
):
    """Track pipeline run metrics"""
    pipeline_runs_total.labels(
        pipeline_id=pipeline_id,
        status=status,
        workspace_id=workspace_id
    ).inc()
    
    pipeline_run_duration_seconds.labels(
        pipeline_id=pipeline_id,
        workspace_id=workspace_id
    ).observe(duration)


def track_connector_operation(
    connector_type: str,
    operation: str,
    status: str,
    duration: float
):
    """Track connector operation metrics"""
    connector_operations_total.labels(
        connector_type=connector_type,
        operation=operation,
        status=status
    ).inc()
    
    connector_operation_duration_seconds.labels(
        connector_type=connector_type,
        operation=operation
    ).observe(duration)


def track_api_request(
    method: str,
    endpoint: str,
    status_code: int,
    duration: float
):
    """Track API request metrics"""
    api_requests_total.labels(
        method=method,
        endpoint=endpoint,
        status_code=str(status_code)
    ).inc()
    
    api_request_duration_seconds.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration)


def track_circuit_breaker_state(circuit_name: str, state: str):
    """Track circuit breaker state"""
    state_value = {'closed': 0, 'half_open': 1, 'open': 2}.get(state, 0)
    circuit_breaker_state.labels(circuit_name=circuit_name).set(state_value)


def timed_operation(metric: Histogram, **labels):
    """Decorator to time operations and record to histogram"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            start_time = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.perf_counter() - start_time
                metric.labels(**labels).observe(duration)
        return wrapper
    return decorator


def increment_counter(counter: Counter, **labels):
    """Decorator to increment counter on function call"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            try:
                result = func(*args, **kwargs)
                counter.labels(**labels, status='success').inc()
                return result
            except Exception as e:
                counter.labels(**labels, status='error').inc()
                raise
        return wrapper
    return decorator

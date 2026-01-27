"""
Resilience patterns for pipeline execution.

This module provides:
- Circuit breaker pattern for external service protection
- Retry policies with exponential backoff
- Dead letter queue for failed records
- Partial failure recovery mechanisms
"""

import time
import logging
import functools
from typing import Any, Callable, Dict, List, Optional, TypeVar, Generic
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from threading import Lock
from collections import deque
import json
import traceback

from django.core.cache import cache
from django.utils import timezone

from integration.exceptions import (
    ConnectorError,
    ConnectionError,
    ReadError,
    WriteError,
    ConveyorETLException
)

logger = logging.getLogger(__name__)

T = TypeVar('T')


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject calls
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5          # Failures before opening
    success_threshold: int = 3          # Successes to close from half-open
    timeout: int = 60                   # Seconds before trying half-open
    excluded_exceptions: tuple = ()     # Exceptions that don't count as failures


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.
    
    Protects external services from being overwhelmed and provides
    fast-fail behavior when services are unavailable.
    """
    
    def __init__(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None
    ):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._lock = Lock()
        
        # Cache key for distributed state
        self._cache_key = f"circuit_breaker:{name}"
    
    @property
    def state(self) -> CircuitState:
        """Get current state, checking for timeout transition"""
        with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._state = CircuitState.HALF_OPEN
                    self._success_count = 0
                    logger.info(f"Circuit breaker '{self.name}' transitioning to HALF_OPEN")
            return self._state
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try half-open"""
        if self._last_failure_time is None:
            return True
        elapsed = (datetime.now() - self._last_failure_time).total_seconds()
        return elapsed >= self.config.timeout
    
    def record_success(self):
        """Record a successful call"""
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.config.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    logger.info(f"Circuit breaker '{self.name}' CLOSED after recovery")
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0
    
    def record_failure(self, exception: Exception):
        """Record a failed call"""
        # Don't count excluded exceptions
        if isinstance(exception, self.config.excluded_exceptions):
            return
        
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = datetime.now()
            
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                logger.warning(f"Circuit breaker '{self.name}' OPEN after half-open failure")
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.config.failure_threshold:
                    self._state = CircuitState.OPEN
                    logger.warning(
                        f"Circuit breaker '{self.name}' OPEN after {self._failure_count} failures"
                    )
    
    def is_available(self) -> bool:
        """Check if calls should be allowed"""
        return self.state != CircuitState.OPEN
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap functions with circuit breaker"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not self.is_available():
                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{self.name}' is OPEN. Service unavailable."
                )
            
            try:
                result = func(*args, **kwargs)
                self.record_success()
                return result
            except Exception as e:
                self.record_failure(e)
                raise
        
        return wrapper


class CircuitBreakerOpenError(ConveyorETLException):
    """Raised when circuit breaker is open"""
    pass


# Global circuit breaker registry
_circuit_breakers: Dict[str, CircuitBreaker] = {}
_cb_lock = Lock()


def get_circuit_breaker(
    name: str,
    config: Optional[CircuitBreakerConfig] = None
) -> CircuitBreaker:
    """Get or create a circuit breaker by name"""
    with _cb_lock:
        if name not in _circuit_breakers:
            _circuit_breakers[name] = CircuitBreaker(name, config)
        return _circuit_breakers[name]


@dataclass
class RetryConfig:
    """Configuration for retry policy"""
    max_retries: int = 3
    initial_delay: float = 1.0          # seconds
    max_delay: float = 60.0             # seconds
    exponential_base: float = 2.0
    jitter: bool = True                 # Add randomness to prevent thundering herd
    retryable_exceptions: tuple = (
        ConnectionError,
        ReadError,
        WriteError,
        TimeoutError,
        OSError,
    )


class RetryPolicy:
    """
    Retry policy with exponential backoff.
    
    Implements exponential backoff with optional jitter to prevent
    thundering herd problems when services recover.
    """
    
    def __init__(self, config: Optional[RetryConfig] = None):
        self.config = config or RetryConfig()
    
    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number"""
        delay = min(
            self.config.initial_delay * (self.config.exponential_base ** attempt),
            self.config.max_delay
        )
        
        if self.config.jitter:
            import random
            delay = delay * (0.5 + random.random())
        
        return delay
    
    def should_retry(self, exception: Exception, attempt: int) -> bool:
        """Determine if operation should be retried"""
        if attempt >= self.config.max_retries:
            return False
        return isinstance(exception, self.config.retryable_exceptions)
    
    def execute(
        self,
        func: Callable[..., T],
        *args,
        on_retry: Optional[Callable[[int, Exception], None]] = None,
        **kwargs
    ) -> T:
        """
        Execute function with retry logic.
        
        Args:
            func: Function to execute
            *args: Positional arguments for func
            on_retry: Optional callback called before each retry
            **kwargs: Keyword arguments for func
            
        Returns:
            Result of func
            
        Raises:
            Last exception if all retries exhausted
        """
        last_exception = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if not self.should_retry(e, attempt):
                    raise
                
                delay = self.calculate_delay(attempt)
                
                logger.warning(
                    f"Retry {attempt + 1}/{self.config.max_retries} after {delay:.2f}s "
                    f"due to: {str(e)}"
                )
                
                if on_retry:
                    on_retry(attempt, e)
                
                time.sleep(delay)
        
        raise last_exception
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap functions with retry logic"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return self.execute(func, *args, **kwargs)
        return wrapper


def with_retry(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = (ConnectionError, ReadError, WriteError)
):
    """
    Decorator factory for retry with exponential backoff.
    
    Usage:
        @with_retry(max_retries=5, initial_delay=2.0)
        def my_function():
            ...
    """
    config = RetryConfig(
        max_retries=max_retries,
        initial_delay=initial_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
        retryable_exceptions=retryable_exceptions
    )
    policy = RetryPolicy(config)
    return policy


@dataclass
class FailedRecord:
    """Represents a record that failed processing"""
    record_id: str
    stream: str
    data: Dict[str, Any]
    error_message: str
    error_type: str
    traceback: str
    attempt_count: int
    first_failed_at: datetime
    last_failed_at: datetime
    pipeline_id: str
    pipeline_run_id: str


class DeadLetterQueue:
    """
    Dead letter queue for failed records.
    
    Stores records that failed processing for later inspection,
    retry, or manual intervention.
    """
    
    def __init__(
        self,
        pipeline_id: str,
        max_size: int = 10000,
        persist_to_db: bool = True
    ):
        self.pipeline_id = pipeline_id
        self.max_size = max_size
        self.persist_to_db = persist_to_db
        self._queue: deque = deque(maxlen=max_size)
        self._lock = Lock()
    
    def add(
        self,
        record_data: Dict[str, Any],
        stream: str,
        error: Exception,
        pipeline_run_id: str,
        attempt_count: int = 1
    ) -> FailedRecord:
        """Add a failed record to the queue"""
        import uuid
        
        failed_record = FailedRecord(
            record_id=str(uuid.uuid4()),
            stream=stream,
            data=record_data,
            error_message=str(error),
            error_type=type(error).__name__,
            traceback=traceback.format_exc(),
            attempt_count=attempt_count,
            first_failed_at=timezone.now(),
            last_failed_at=timezone.now(),
            pipeline_id=self.pipeline_id,
            pipeline_run_id=pipeline_run_id
        )
        
        with self._lock:
            self._queue.append(failed_record)
        
        if self.persist_to_db:
            self._persist_record(failed_record)
        
        logger.warning(
            f"Added record to DLQ: stream={stream}, error={error}, "
            f"queue_size={len(self._queue)}"
        )
        
        return failed_record
    
    def _persist_record(self, record: FailedRecord):
        """Persist failed record to database"""
        from integration.models import FailedPipelineRecord
        
        try:
            FailedPipelineRecord.objects.create(
                record_id=record.record_id,
                pipeline_id=record.pipeline_id,
                pipeline_run_id=record.pipeline_run_id,
                stream=record.stream,
                data=record.data,
                error_message=record.error_message,
                error_type=record.error_type,
                error_traceback=record.traceback,
                attempt_count=record.attempt_count,
                first_failed_at=record.first_failed_at,
                last_failed_at=record.last_failed_at
            )
        except Exception as e:
            logger.error(f"Failed to persist DLQ record: {e}")
    
    def get_all(self) -> List[FailedRecord]:
        """Get all records in the queue"""
        with self._lock:
            return list(self._queue)
    
    def get_by_stream(self, stream: str) -> List[FailedRecord]:
        """Get records for a specific stream"""
        with self._lock:
            return [r for r in self._queue if r.stream == stream]
    
    def clear(self):
        """Clear all records from queue"""
        with self._lock:
            self._queue.clear()
    
    def size(self) -> int:
        """Get current queue size"""
        return len(self._queue)
    
    def get_retry_candidates(self, max_attempts: int = 3) -> List[FailedRecord]:
        """Get records that can be retried"""
        with self._lock:
            return [r for r in self._queue if r.attempt_count < max_attempts]


@dataclass
class PartialFailureState:
    """Tracks partial failure state for recovery"""
    pipeline_id: str
    pipeline_run_id: str
    completed_streams: List[str] = field(default_factory=list)
    failed_streams: List[str] = field(default_factory=list)
    current_stream: Optional[str] = None
    current_offset: int = 0
    total_records_processed: int = 0
    total_records_failed: int = 0
    checkpoint_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'pipeline_id': self.pipeline_id,
            'pipeline_run_id': self.pipeline_run_id,
            'completed_streams': self.completed_streams,
            'failed_streams': self.failed_streams,
            'current_stream': self.current_stream,
            'current_offset': self.current_offset,
            'total_records_processed': self.total_records_processed,
            'total_records_failed': self.total_records_failed,
            'checkpoint_at': self.checkpoint_at.isoformat() if self.checkpoint_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PartialFailureState':
        """Create from dictionary"""
        return cls(
            pipeline_id=data['pipeline_id'],
            pipeline_run_id=data['pipeline_run_id'],
            completed_streams=data.get('completed_streams', []),
            failed_streams=data.get('failed_streams', []),
            current_stream=data.get('current_stream'),
            current_offset=data.get('current_offset', 0),
            total_records_processed=data.get('total_records_processed', 0),
            total_records_failed=data.get('total_records_failed', 0),
            checkpoint_at=datetime.fromisoformat(data['checkpoint_at']) if data.get('checkpoint_at') else None
        )


class PartialFailureRecovery:
    """
    Handles partial failure recovery for pipeline execution.
    
    Enables resuming pipeline execution from the last successful checkpoint
    when failures occur, preventing re-processing of already completed work.
    """
    
    def __init__(self, pipeline_id: str, pipeline_run_id: str):
        self.pipeline_id = pipeline_id
        self.pipeline_run_id = pipeline_run_id
        self._cache_key = f"pipeline_checkpoint:{pipeline_id}:{pipeline_run_id}"
        self._state: Optional[PartialFailureState] = None
    
    def initialize(self) -> PartialFailureState:
        """Initialize or load existing state"""
        # Try to load from cache first
        cached_state = cache.get(self._cache_key)
        if cached_state:
            self._state = PartialFailureState.from_dict(json.loads(cached_state))
            logger.info(f"Loaded checkpoint state for pipeline {self.pipeline_id}")
        else:
            self._state = PartialFailureState(
                pipeline_id=self.pipeline_id,
                pipeline_run_id=self.pipeline_run_id
            )
        return self._state
    
    def checkpoint(
        self,
        stream: str,
        offset: int,
        records_processed: int,
        records_failed: int
    ):
        """Save checkpoint for current progress"""
        if not self._state:
            self.initialize()
        
        self._state.current_stream = stream
        self._state.current_offset = offset
        self._state.total_records_processed += records_processed
        self._state.total_records_failed += records_failed
        self._state.checkpoint_at = timezone.now()
        
        # Persist to cache
        cache.set(
            self._cache_key,
            json.dumps(self._state.to_dict()),
            timeout=86400  # 24 hours
        )
        
        logger.debug(f"Checkpoint saved: stream={stream}, offset={offset}")
    
    def mark_stream_completed(self, stream: str):
        """Mark a stream as completed"""
        if not self._state:
            self.initialize()
        
        if stream not in self._state.completed_streams:
            self._state.completed_streams.append(stream)
        
        if stream in self._state.failed_streams:
            self._state.failed_streams.remove(stream)
        
        self._state.current_stream = None
        self._state.current_offset = 0
        
        # Persist
        cache.set(
            self._cache_key,
            json.dumps(self._state.to_dict()),
            timeout=86400
        )
    
    def mark_stream_failed(self, stream: str):
        """Mark a stream as failed"""
        if not self._state:
            self.initialize()
        
        if stream not in self._state.failed_streams:
            self._state.failed_streams.append(stream)
    
    def get_resume_point(self) -> Optional[Dict[str, Any]]:
        """Get the point to resume from"""
        if not self._state:
            self.initialize()
        
        if self._state.current_stream:
            return {
                'stream': self._state.current_stream,
                'offset': self._state.current_offset,
                'completed_streams': self._state.completed_streams
            }
        return None
    
    def should_skip_stream(self, stream: str) -> bool:
        """Check if stream should be skipped (already completed)"""
        if not self._state:
            self.initialize()
        return stream in self._state.completed_streams
    
    def cleanup(self):
        """Clean up checkpoint state"""
        cache.delete(self._cache_key)
        self._state = None


class ResilientPipelineExecutor:
    """
    Wrapper that adds resilience patterns to pipeline execution.
    
    Combines circuit breaker, retry policy, dead letter queue, and
    partial failure recovery for robust pipeline execution.
    """
    
    def __init__(
        self,
        pipeline_id: str,
        pipeline_run_id: str,
        retry_config: Optional[RetryConfig] = None,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None,
        dlq_max_size: int = 10000
    ):
        self.pipeline_id = pipeline_id
        self.pipeline_run_id = pipeline_run_id
        
        # Initialize resilience components
        self.retry_policy = RetryPolicy(retry_config or RetryConfig())
        self.source_circuit_breaker = get_circuit_breaker(
            f"source:{pipeline_id}",
            circuit_breaker_config
        )
        self.destination_circuit_breaker = get_circuit_breaker(
            f"destination:{pipeline_id}",
            circuit_breaker_config
        )
        self.dlq = DeadLetterQueue(pipeline_id, max_size=dlq_max_size)
        self.recovery = PartialFailureRecovery(pipeline_id, pipeline_run_id)
    
    def execute_with_retry(
        self,
        func: Callable[..., T],
        *args,
        operation_name: str = "operation",
        **kwargs
    ) -> T:
        """Execute a function with retry and logging"""
        def on_retry(attempt: int, error: Exception):
            logger.warning(
                f"Pipeline {self.pipeline_id}: {operation_name} retry {attempt + 1} "
                f"after error: {error}"
            )
        
        return self.retry_policy.execute(
            func, *args, on_retry=on_retry, **kwargs
        )
    
    def read_with_resilience(
        self,
        connector,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ):
        """Read from source with circuit breaker and retry"""
        if not self.source_circuit_breaker.is_available():
            raise CircuitBreakerOpenError(
                f"Source circuit breaker is open for pipeline {self.pipeline_id}"
            )
        
        try:
            result = self.execute_with_retry(
                connector.read,
                stream=stream,
                schema=schema,
                state=state,
                operation_name=f"read:{stream}"
            )
            self.source_circuit_breaker.record_success()
            return result
        except Exception as e:
            self.source_circuit_breaker.record_failure(e)
            raise
    
    def write_with_resilience(
        self,
        writer,
        stream: str,
        schema: Dict[str, Any],
        records,
        key_properties: List[str]
    ):
        """Write to destination with circuit breaker and retry"""
        if not self.destination_circuit_breaker.is_available():
            raise CircuitBreakerOpenError(
                f"Destination circuit breaker is open for pipeline {self.pipeline_id}"
            )
        
        try:
            result = self.execute_with_retry(
                writer.write,
                stream=stream,
                schema=schema,
                records=records,
                key_properties=key_properties,
                operation_name=f"write:{stream}"
            )
            self.destination_circuit_breaker.record_success()
            return result
        except Exception as e:
            self.destination_circuit_breaker.record_failure(e)
            raise
    
    def handle_record_failure(
        self,
        record_data: Dict[str, Any],
        stream: str,
        error: Exception,
        attempt_count: int = 1
    ):
        """Handle a failed record by adding to DLQ"""
        self.dlq.add(
            record_data=record_data,
            stream=stream,
            error=error,
            pipeline_run_id=self.pipeline_run_id,
            attempt_count=attempt_count
        )
    
    def get_execution_summary(self) -> Dict[str, Any]:
        """Get summary of execution including failures"""
        state = self.recovery._state
        return {
            'pipeline_id': self.pipeline_id,
            'pipeline_run_id': self.pipeline_run_id,
            'completed_streams': state.completed_streams if state else [],
            'failed_streams': state.failed_streams if state else [],
            'total_records_processed': state.total_records_processed if state else 0,
            'total_records_failed': state.total_records_failed if state else 0,
            'dlq_size': self.dlq.size(),
            'source_circuit_state': self.source_circuit_breaker.state.value,
            'destination_circuit_state': self.destination_circuit_breaker.state.value
        }

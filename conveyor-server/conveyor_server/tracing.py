"""
OpenTelemetry distributed tracing configuration for Conveyor.

Provides distributed tracing across the application for debugging,
performance analysis, and observability.
"""

import os
from typing import Optional, Dict, Any
from functools import wraps

from django.conf import settings


def setup_tracing():
    """
    Initialize OpenTelemetry tracing.
    
    Should be called early in application startup (e.g., in manage.py or wsgi.py).
    """
    # Only setup if OTEL endpoint is configured
    otel_endpoint = os.getenv('OTEL_EXPORTER_OTLP_ENDPOINT')
    if not otel_endpoint and not settings.DEBUG:
        return
    
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        
        # Create resource with service information
        resource = Resource.create({
            SERVICE_NAME: "conveyor-server",
            SERVICE_VERSION: "1.0.0",
            "deployment.environment": "production" if not settings.DEBUG else "development",
        })
        
        # Create tracer provider
        provider = TracerProvider(resource=resource)
        
        # Add OTLP exporter if endpoint is configured
        if otel_endpoint:
            otlp_exporter = OTLPSpanExporter(endpoint=otel_endpoint)
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        
        # Add console exporter in debug mode
        if settings.DEBUG:
            console_exporter = ConsoleSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(console_exporter))
        
        # Set the global tracer provider
        trace.set_tracer_provider(provider)
        
        # Instrument Django
        _instrument_django()
        
        # Instrument Celery
        _instrument_celery()
        
        # Instrument Redis
        _instrument_redis()
        
        # Instrument database
        _instrument_database()
        
        print("OpenTelemetry tracing initialized successfully")
        
    except ImportError as e:
        print(f"OpenTelemetry packages not installed: {e}")
    except Exception as e:
        print(f"Failed to initialize OpenTelemetry: {e}")


def _instrument_django():
    """Instrument Django with OpenTelemetry"""
    try:
        from opentelemetry.instrumentation.django import DjangoInstrumentor
        DjangoInstrumentor().instrument()
    except ImportError:
        pass
    except Exception as e:
        print(f"Failed to instrument Django: {e}")


def _instrument_celery():
    """Instrument Celery with OpenTelemetry"""
    try:
        from opentelemetry.instrumentation.celery import CeleryInstrumentor
        CeleryInstrumentor().instrument()
    except ImportError:
        pass
    except Exception as e:
        print(f"Failed to instrument Celery: {e}")


def _instrument_redis():
    """Instrument Redis with OpenTelemetry"""
    try:
        from opentelemetry.instrumentation.redis import RedisInstrumentor
        RedisInstrumentor().instrument()
    except ImportError:
        pass
    except Exception as e:
        print(f"Failed to instrument Redis: {e}")


def _instrument_database():
    """Instrument PostgreSQL with OpenTelemetry"""
    try:
        from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
        Psycopg2Instrumentor().instrument()
    except ImportError:
        pass
    except Exception as e:
        print(f"Failed to instrument psycopg2: {e}")


def get_tracer(name: str = "conveyor"):
    """Get a tracer instance"""
    try:
        from opentelemetry import trace
        return trace.get_tracer(name)
    except ImportError:
        return None


class TracingContext:
    """Context manager for creating spans"""
    
    def __init__(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        kind: Optional[str] = None
    ):
        self.name = name
        self.attributes = attributes or {}
        self.kind = kind
        self.span = None
        self.tracer = get_tracer()
    
    def __enter__(self):
        if self.tracer:
            try:
                from opentelemetry import trace
                
                span_kind = trace.SpanKind.INTERNAL
                if self.kind == 'server':
                    span_kind = trace.SpanKind.SERVER
                elif self.kind == 'client':
                    span_kind = trace.SpanKind.CLIENT
                elif self.kind == 'producer':
                    span_kind = trace.SpanKind.PRODUCER
                elif self.kind == 'consumer':
                    span_kind = trace.SpanKind.CONSUMER
                
                self.span = self.tracer.start_span(
                    self.name,
                    kind=span_kind,
                    attributes=self.attributes
                )
                return self.span
            except Exception:
                pass
        return None
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.span:
            try:
                if exc_type:
                    self.span.set_status(
                        trace.Status(trace.StatusCode.ERROR, str(exc_val))
                    )
                    self.span.record_exception(exc_val)
                self.span.end()
            except Exception:
                pass


def traced(
    name: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    kind: str = 'internal'
):
    """
    Decorator to trace function execution.
    
    Usage:
        @traced(name="my_operation", attributes={"key": "value"})
        def my_function():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            span_name = name or f"{func.__module__}.{func.__name__}"
            span_attributes = attributes or {}
            
            tracer = get_tracer()
            if not tracer:
                return func(*args, **kwargs)
            
            try:
                from opentelemetry import trace
                
                span_kind = trace.SpanKind.INTERNAL
                if kind == 'server':
                    span_kind = trace.SpanKind.SERVER
                elif kind == 'client':
                    span_kind = trace.SpanKind.CLIENT
                
                with tracer.start_as_current_span(
                    span_name,
                    kind=span_kind,
                    attributes=span_attributes
                ) as span:
                    try:
                        result = func(*args, **kwargs)
                        return result
                    except Exception as e:
                        span.set_status(
                            trace.Status(trace.StatusCode.ERROR, str(e))
                        )
                        span.record_exception(e)
                        raise
            except ImportError:
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def add_span_attributes(attributes: Dict[str, Any]):
    """Add attributes to the current span"""
    try:
        from opentelemetry import trace
        
        span = trace.get_current_span()
        if span and span.is_recording():
            for key, value in attributes.items():
                span.set_attribute(key, value)
    except Exception:
        pass


def add_span_event(name: str, attributes: Optional[Dict[str, Any]] = None):
    """Add an event to the current span"""
    try:
        from opentelemetry import trace
        
        span = trace.get_current_span()
        if span and span.is_recording():
            span.add_event(name, attributes=attributes or {})
    except Exception:
        pass


def set_span_error(error: Exception):
    """Mark the current span as errored"""
    try:
        from opentelemetry import trace
        
        span = trace.get_current_span()
        if span and span.is_recording():
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
            span.record_exception(error)
    except Exception:
        pass


# Pipeline-specific tracing helpers
def trace_pipeline_execution(pipeline_id: str, pipeline_run_id: str):
    """Create a span for pipeline execution"""
    return TracingContext(
        name="pipeline.execution",
        attributes={
            "pipeline.id": pipeline_id,
            "pipeline.run_id": pipeline_run_id,
        },
        kind="consumer"
    )


def trace_connector_operation(
    connector_type: str,
    operation: str,
    source_id: str
):
    """Create a span for connector operations"""
    return TracingContext(
        name=f"connector.{operation}",
        attributes={
            "connector.type": connector_type,
            "connector.operation": operation,
            "source.id": source_id,
        },
        kind="client"
    )


def trace_lakehouse_write(layer: str, table: str, records: int):
    """Create a span for lakehouse write operations"""
    return TracingContext(
        name="lakehouse.write",
        attributes={
            "lakehouse.layer": layer,
            "lakehouse.table": table,
            "lakehouse.records": records,
        },
        kind="client"
    )

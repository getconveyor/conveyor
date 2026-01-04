"""
Structured logging configuration using structlog.

Provides consistent, machine-readable logs with context propagation,
performance timing, and integration with OpenTelemetry tracing.
"""

import logging
import sys
from typing import Any, Dict, Optional

import structlog
from structlog.types import EventDict, WrappedLogger
from django.conf import settings


def add_app_context(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add application context to log events"""
    event_dict['app'] = 'conveyor'
    event_dict['environment'] = 'production' if not settings.DEBUG else 'development'
    return event_dict


def add_request_id(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add request ID from context if available"""
    try:
        from contextvars import ContextVar
        request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
        request_id = request_id_var.get()
        if request_id:
            event_dict['request_id'] = request_id
    except Exception:
        pass
    return event_dict


def add_trace_context(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add OpenTelemetry trace context if available"""
    try:
        from opentelemetry import trace
        
        current_span = trace.get_current_span()
        if current_span and current_span.is_recording():
            ctx = current_span.get_span_context()
            event_dict['trace_id'] = format(ctx.trace_id, '032x')
            event_dict['span_id'] = format(ctx.span_id, '016x')
    except ImportError:
        pass
    except Exception:
        pass
    return event_dict


def configure_structlog():
    """Configure structlog for the application"""
    
    # Shared processors for all loggers
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        add_app_context,
        add_request_id,
        add_trace_context,
    ]
    
    if settings.DEBUG:
        # Development: colorful console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # Production: JSON output
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ]
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging to use structlog
    logging.config.dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': structlog.stdlib.ProcessorFormatter,
                'processor': structlog.processors.JSONRenderer(),
                'foreign_pre_chain': shared_processors,
            },
            'console': {
                '()': structlog.stdlib.ProcessorFormatter,
                'processor': structlog.dev.ConsoleRenderer(colors=True),
                'foreign_pre_chain': shared_processors,
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'console' if settings.DEBUG else 'json',
                'stream': sys.stdout,
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'DEBUG' if settings.DEBUG else 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.db.backends': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'celery': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'integration': {
                'handlers': ['console'],
                'level': 'DEBUG' if settings.DEBUG else 'INFO',
                'propagate': False,
            },
            'conveyor': {
                'handlers': ['console'],
                'level': 'DEBUG' if settings.DEBUG else 'INFO',
                'propagate': False,
            },
        },
    })


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a structlog logger with optional name"""
    return structlog.get_logger(name)


class LogContext:
    """Context manager for adding temporary logging context"""
    
    def __init__(self, **kwargs):
        self.context = kwargs
    
    def __enter__(self):
        structlog.contextvars.bind_contextvars(**self.context)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        structlog.contextvars.unbind_contextvars(*self.context.keys())


def log_pipeline_event(
    pipeline_id: str,
    event: str,
    level: str = 'info',
    **extra
):
    """Log a pipeline-related event with consistent structure"""
    logger = get_logger('integration.pipeline')
    log_method = getattr(logger, level, logger.info)
    log_method(
        event,
        pipeline_id=pipeline_id,
        **extra
    )


def log_connector_event(
    connector_type: str,
    source_id: str,
    event: str,
    level: str = 'info',
    **extra
):
    """Log a connector-related event with consistent structure"""
    logger = get_logger('integration.connector')
    log_method = getattr(logger, level, logger.info)
    log_method(
        event,
        connector_type=connector_type,
        source_id=source_id,
        **extra
    )


def log_api_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    **extra
):
    """Log an API request with consistent structure"""
    logger = get_logger('api.request')
    
    level = 'info'
    if status_code >= 500:
        level = 'error'
    elif status_code >= 400:
        level = 'warning'
    
    log_method = getattr(logger, level, logger.info)
    log_method(
        'api_request',
        http_method=method,
        http_path=path,
        http_status=status_code,
        duration_ms=duration_ms,
        user_id=user_id,
        workspace_id=workspace_id,
        **extra
    )

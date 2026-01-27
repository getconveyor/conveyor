"""
Observability middleware for request logging, tracing, and metrics.

Integrates with structlog for structured logging and Prometheus for metrics.
"""

import time
import uuid
from typing import Callable
from contextvars import ContextVar

from django.http import HttpRequest, HttpResponse
from django.conf import settings


# Context variable for request ID propagation
request_id_var: ContextVar[str] = ContextVar('request_id', default='')


class RequestLoggingMiddleware:
    """
    Middleware for logging HTTP requests with structured logging.
    
    Features:
    - Generates unique request ID for tracing
    - Logs request/response details
    - Tracks request duration
    - Integrates with structlog
    """
    
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Generate or extract request ID
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request_id_var.set(request_id)
        
        # Store on request for access in views
        request.request_id = request_id
        
        # Record start time
        start_time = time.perf_counter()
        
        # Get user and workspace info
        user_id = None
        workspace_id = request.headers.get('X-Workspace-ID')
        
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = str(request.user.id)
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000
        
        # Add request ID to response headers
        response['X-Request-ID'] = request_id
        
        # Log request (skip health checks and static files)
        if not self._should_skip_logging(request.path):
            self._log_request(
                request=request,
                response=response,
                duration_ms=duration_ms,
                request_id=request_id,
                user_id=user_id,
                workspace_id=workspace_id
            )
            
            # Record metrics
            self._record_metrics(
                request=request,
                response=response,
                duration_ms=duration_ms
            )
        
        return response
    
    def _should_skip_logging(self, path: str) -> bool:
        """Check if request should skip logging"""
        skip_paths = [
            '/health',
            '/ready',
            '/metrics',
            '/static/',
            '/favicon.ico',
        ]
        return any(path.startswith(p) for p in skip_paths)
    
    def _log_request(
        self,
        request: HttpRequest,
        response: HttpResponse,
        duration_ms: float,
        request_id: str,
        user_id: str = None,
        workspace_id: str = None
    ):
        """Log request details using structlog"""
        try:
            from conveyor_server.logging_config import log_api_request
            
            log_api_request(
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                user_id=user_id,
                workspace_id=workspace_id,
                request_id=request_id,
                user_agent=request.headers.get('User-Agent', ''),
                content_length=response.get('Content-Length', 0),
            )
        except ImportError:
            # Fall back to standard logging if structlog not configured
            import logging
            logger = logging.getLogger('django.request')
            logger.info(
                f"{request.method} {request.path} {response.status_code} "
                f"{duration_ms:.2f}ms"
            )
    
    def _record_metrics(
        self,
        request: HttpRequest,
        response: HttpResponse,
        duration_ms: float
    ):
        """Record Prometheus metrics"""
        try:
            from conveyor_server.metrics import track_api_request
            
            # Normalize endpoint for cardinality control
            endpoint = self._normalize_endpoint(request.path)
            
            track_api_request(
                method=request.method,
                endpoint=endpoint,
                status_code=response.status_code,
                duration=duration_ms / 1000  # Convert to seconds
            )
        except ImportError:
            pass
    
    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path to reduce cardinality"""
        import re
        
        # Replace UUIDs with placeholder
        path = re.sub(
            r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '{id}',
            path,
            flags=re.IGNORECASE
        )
        
        # Replace numeric IDs with placeholder
        path = re.sub(r'/\d+(?=/|$)', '/{id}', path)
        
        return path


class SQLInjectionProtectionMiddleware:
    """
    Middleware to detect and block potential SQL injection attempts.
    
    This provides an additional layer of protection for API endpoints
    that accept SQL queries (like the lakehouse SQL editor).
    """
    
    # Common SQL injection patterns
    SUSPICIOUS_PATTERNS = [
        r';\s*DROP\s+',
        r';\s*DELETE\s+',
        r';\s*UPDATE\s+.*SET\s+',
        r';\s*INSERT\s+INTO\s+',
        r';\s*ALTER\s+',
        r';\s*CREATE\s+',
        r';\s*TRUNCATE\s+',
        r';\s*EXEC\s+',
        r'UNION\s+ALL\s+SELECT',
        r'UNION\s+SELECT',
        r'INTO\s+OUTFILE',
        r'INTO\s+DUMPFILE',
        r'LOAD_FILE\s*\(',
        r'--\s*$',  # SQL comment at end
        r'/\*.*\*/',  # Block comment
        r';\s*SHUTDOWN',
        r'xp_cmdshell',
        r'sp_executesql',
    ]
    
    # Paths that accept SQL queries and need protection
    SQL_PATHS = [
        '/api/lakehouse/query',
        '/api/lakehouse/execute',
        '/api/warehouse/query',
    ]
    
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        import re
        self.patterns = [
            re.compile(pattern, re.IGNORECASE | re.DOTALL)
            for pattern in self.SUSPICIOUS_PATTERNS
        ]
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Only check relevant paths
        if any(request.path.startswith(path) for path in self.SQL_PATHS):
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    body = request.body.decode('utf-8')
                    if self._contains_injection(body):
                        return self._blocked_response(request)
                except Exception:
                    pass
        
        return self.get_response(request)
    
    def _contains_injection(self, content: str) -> bool:
        """Check if content contains potential SQL injection"""
        for pattern in self.patterns:
            if pattern.search(content):
                return True
        return False
    
    def _blocked_response(self, request: HttpRequest) -> HttpResponse:
        """Return blocked response"""
        import json
        import logging
        
        logger = logging.getLogger('security')
        logger.warning(
            f"Blocked potential SQL injection attempt: "
            f"path={request.path}, "
            f"ip={self._get_client_ip(request)}"
        )
        
        from django.http import JsonResponse
        return JsonResponse(
            {
                'error': 'Request blocked',
                'detail': 'Potentially dangerous SQL detected'
            },
            status=400
        )
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')


class RateLimitMiddleware:
    """
    Simple rate limiting middleware using Django cache.
    
    Provides per-user and per-IP rate limiting.
    """
    
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        self.rate_limit = getattr(settings, 'API_RATE_LIMIT', 1000)  # requests per hour
        self.window = 3600  # 1 hour
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Skip rate limiting for certain paths
        if self._should_skip(request.path):
            return self.get_response(request)
        
        # Get rate limit key
        key = self._get_rate_limit_key(request)
        
        # Check rate limit
        if not self._check_rate_limit(key):
            return self._rate_limited_response()
        
        return self.get_response(request)
    
    def _should_skip(self, path: str) -> bool:
        """Check if path should skip rate limiting"""
        skip_paths = ['/admin/', '/health', '/ready', '/metrics']
        return any(path.startswith(p) for p in skip_paths)
    
    def _get_rate_limit_key(self, request: HttpRequest) -> str:
        """Get key for rate limiting"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"ratelimit:user:{request.user.id}"
        
        ip = self._get_client_ip(request)
        return f"ratelimit:ip:{ip}"
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')
    
    def _check_rate_limit(self, key: str) -> bool:
        """Check and update rate limit"""
        from django.core.cache import cache
        
        current = cache.get(key, 0)
        if current >= self.rate_limit:
            return False
        
        cache.set(key, current + 1, timeout=self.window)
        return True
    
    def _rate_limited_response(self) -> HttpResponse:
        """Return rate limited response"""
        from django.http import JsonResponse
        
        return JsonResponse(
            {
                'error': 'Rate limit exceeded',
                'detail': f'Maximum {self.rate_limit} requests per hour'
            },
            status=429
        )

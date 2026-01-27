"""
Caching utilities for API responses and data.

Provides decorators and utilities for caching expensive operations
using Redis.
"""

import hashlib
import json
import functools
from typing import Any, Callable, Optional, TypeVar, Union
from datetime import timedelta

from django.core.cache import cache
from django.conf import settings
from rest_framework.request import Request

T = TypeVar('T')


class CacheKeyBuilder:
    """Builds consistent cache keys for various scenarios."""
    
    PREFIX = 'conveyor'
    
    @classmethod
    def for_view(
        cls,
        view_name: str,
        workspace_id: str = None,
        user_id: str = None,
        params: dict = None
    ) -> str:
        """Build cache key for a view response."""
        parts = [cls.PREFIX, 'view', view_name]
        
        if workspace_id:
            parts.append(f'ws:{workspace_id}')
        
        if user_id:
            parts.append(f'user:{user_id}')
        
        if params:
            # Create hash of params for key
            params_hash = hashlib.md5(
                json.dumps(params, sort_keys=True).encode()
            ).hexdigest()[:12]
            parts.append(f'params:{params_hash}')
        
        return ':'.join(parts)
    
    @classmethod
    def for_query(
        cls,
        query_hash: str,
        workspace_id: str = None
    ) -> str:
        """Build cache key for a query result."""
        parts = [cls.PREFIX, 'query', query_hash]
        
        if workspace_id:
            parts.append(f'ws:{workspace_id}')
        
        return ':'.join(parts)
    
    @classmethod
    def for_model(
        cls,
        model_name: str,
        pk: str,
        workspace_id: str = None
    ) -> str:
        """Build cache key for a model instance."""
        parts = [cls.PREFIX, 'model', model_name, str(pk)]
        
        if workspace_id:
            parts.append(f'ws:{workspace_id}')
        
        return ':'.join(parts)
    
    @classmethod
    def for_list(
        cls,
        model_name: str,
        workspace_id: str = None,
        filters: dict = None
    ) -> str:
        """Build cache key for a model list."""
        parts = [cls.PREFIX, 'list', model_name]
        
        if workspace_id:
            parts.append(f'ws:{workspace_id}')
        
        if filters:
            filters_hash = hashlib.md5(
                json.dumps(filters, sort_keys=True).encode()
            ).hexdigest()[:12]
            parts.append(f'filters:{filters_hash}')
        
        return ':'.join(parts)


def cache_response(
    timeout: int = 300,
    key_prefix: str = None,
    vary_on_user: bool = False,
    vary_on_workspace: bool = True
):
    """
    Decorator to cache API responses.
    
    Usage:
        @cache_response(timeout=60, key_prefix='pipelines')
        def list(self, request):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(self, request: Request, *args, **kwargs):
            # Build cache key
            workspace_id = request.headers.get('X-Workspace-ID') if vary_on_workspace else None
            user_id = str(request.user.id) if vary_on_user and request.user.is_authenticated else None
            
            # Include query params in cache key
            params = dict(request.query_params) if request.query_params else None
            
            view_name = key_prefix or f"{self.__class__.__name__}.{func.__name__}"
            cache_key = CacheKeyBuilder.for_view(
                view_name=view_name,
                workspace_id=workspace_id,
                user_id=user_id,
                params=params
            )
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute view
            response = func(self, request, *args, **kwargs)
            
            # Cache successful responses
            if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                cache.set(cache_key, response, timeout=timeout)
            
            return response
        
        return wrapper
    return decorator


def invalidate_cache(patterns: list):
    """
    Invalidate cache keys matching patterns.
    
    Usage:
        invalidate_cache(['conveyor:view:pipelines:*', 'conveyor:list:Pipeline:*'])
    """
    # Note: This requires Redis with pattern deletion support
    # For production, consider using cache versioning or explicit key tracking
    try:
        from django_redis import get_redis_connection
        
        redis = get_redis_connection('default')
        for pattern in patterns:
            keys = redis.keys(pattern)
            if keys:
                redis.delete(*keys)
    except Exception:
        # Fallback: clear all cache (not ideal but functional)
        pass


def cache_model(timeout: int = 300):
    """
    Decorator to cache model retrieval.
    
    Usage:
        @cache_model(timeout=300)
        def get_pipeline(pipeline_id: str) -> Pipeline:
            return Pipeline.objects.get(id=pipeline_id)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            key_parts = [func.__module__, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            
            cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()
            cache_key = f"conveyor:func:{cache_key}"
            
            # Try cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute and cache
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            
            return result
        
        return wrapper
    return decorator


class QueryResultCache:
    """
    Caches query results for expensive queries.
    """
    
    DEFAULT_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def get_or_execute(
        cls,
        query_text: str,
        executor: Callable,
        workspace_id: str = None,
        timeout: int = None
    ) -> Any:
        """
        Get cached result or execute query.
        
        Args:
            query_text: The SQL query
            executor: Function to execute if not cached
            workspace_id: Optional workspace ID for key scoping
            timeout: Cache timeout in seconds
        
        Returns:
            Query result
        """
        query_hash = hashlib.md5(query_text.encode()).hexdigest()
        cache_key = CacheKeyBuilder.for_query(query_hash, workspace_id)
        
        result = cache.get(cache_key)
        if result is not None:
            return result
        
        result = executor()
        cache.set(cache_key, result, timeout=timeout or cls.DEFAULT_TIMEOUT)
        
        return result
    
    @classmethod
    def invalidate(cls, query_text: str, workspace_id: str = None):
        """Invalidate cache for a specific query."""
        query_hash = hashlib.md5(query_text.encode()).hexdigest()
        cache_key = CacheKeyBuilder.for_query(query_hash, workspace_id)
        cache.delete(cache_key)


class WorkspaceDataCache:
    """
    Workspace-scoped data caching with automatic invalidation.
    """
    
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.version_key = f"conveyor:workspace_version:{workspace_id}"
    
    def get_version(self) -> int:
        """Get current cache version for workspace."""
        version = cache.get(self.version_key)
        if version is None:
            version = 1
            cache.set(self.version_key, version, timeout=None)
        return version
    
    def invalidate_all(self):
        """Invalidate all cached data for workspace by incrementing version."""
        cache.incr(self.version_key)
    
    def get(self, key: str) -> Any:
        """Get value with version check."""
        version = self.get_version()
        full_key = f"conveyor:ws:{self.workspace_id}:v{version}:{key}"
        return cache.get(full_key)
    
    def set(self, key: str, value: Any, timeout: int = 300):
        """Set value with current version."""
        version = self.get_version()
        full_key = f"conveyor:ws:{self.workspace_id}:v{version}:{key}"
        cache.set(full_key, value, timeout=timeout)
    
    def delete(self, key: str):
        """Delete a specific key."""
        version = self.get_version()
        full_key = f"conveyor:ws:{self.workspace_id}:v{version}:{key}"
        cache.delete(full_key)

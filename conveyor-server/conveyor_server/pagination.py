"""
Cursor-based pagination for Django REST Framework.

Provides efficient pagination for large datasets by using opaque cursors
instead of offset-based pagination, avoiding the performance issues of
OFFSET queries on large tables.
"""

import base64
import json
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode

from django.db.models import QuerySet
from rest_framework.pagination import BasePagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.utils.urls import replace_query_param, remove_query_param


class CursorPagination(BasePagination):
    """
    Cursor-based pagination.
    
    Advantages over offset pagination:
    - O(1) performance regardless of page number
    - Stable results even with concurrent inserts/deletes
    - No "skipping" issues with offset
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            pagination_class = CursorPagination
            
        # Or with custom settings:
        class MyPagination(CursorPagination):
            page_size = 50
            ordering = '-created_at'
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    cursor_query_param = 'cursor'
    ordering = '-created_at'  # Default ordering field
    
    def __init__(self):
        self.cursor = None
        self.has_next = False
        self.has_prev = False
        self.next_cursor = None
        self.prev_cursor = None
    
    def paginate_queryset(
        self,
        queryset: QuerySet,
        request: Request,
        view=None
    ) -> Optional[List]:
        """Paginate queryset using cursor."""
        self.page_size = self.get_page_size(request)
        if not self.page_size:
            return None
        
        self.request = request
        self.ordering = self.get_ordering(request, queryset, view)
        
        # Decode cursor
        cursor = self.decode_cursor(request)
        
        # Get ordering field and direction
        ordering_field, is_reversed = self._get_ordering_info()
        
        # Apply cursor filter
        if cursor:
            position = cursor.get('position')
            reverse = cursor.get('reverse', False)
            
            if position is not None:
                if reverse:
                    # Going backwards
                    if is_reversed:
                        queryset = queryset.filter(**{f'{ordering_field}__gt': position})
                    else:
                        queryset = queryset.filter(**{f'{ordering_field}__lt': position})
                else:
                    # Going forwards
                    if is_reversed:
                        queryset = queryset.filter(**{f'{ordering_field}__lt': position})
                    else:
                        queryset = queryset.filter(**{f'{ordering_field}__gt': position})
        
        # Order queryset
        queryset = queryset.order_by(self.ordering)
        
        # Fetch one extra to check for next page
        results = list(queryset[:self.page_size + 1])
        
        self.has_next = len(results) > self.page_size
        if self.has_next:
            results = results[:self.page_size]
        
        # Determine if there's a previous page
        self.has_prev = cursor is not None
        
        # Generate cursors
        if results:
            first_item = results[0]
            last_item = results[-1]
            
            first_position = self._get_position_value(first_item, ordering_field)
            last_position = self._get_position_value(last_item, ordering_field)
            
            if self.has_next:
                self.next_cursor = self.encode_cursor({
                    'position': last_position,
                    'reverse': False
                })
            
            if self.has_prev:
                self.prev_cursor = self.encode_cursor({
                    'position': first_position,
                    'reverse': True
                })
        
        return results
    
    def get_paginated_response(self, data: List) -> Response:
        """Return paginated response with cursor links."""
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'page_size': self.page_size,
        })
    
    def get_paginated_response_schema(self, schema):
        """Return schema for paginated response."""
        return {
            'type': 'object',
            'properties': {
                'next': {
                    'type': 'string',
                    'nullable': True,
                    'format': 'uri',
                },
                'previous': {
                    'type': 'string',
                    'nullable': True,
                    'format': 'uri',
                },
                'results': schema,
                'page_size': {
                    'type': 'integer',
                },
            },
        }
    
    def get_next_link(self) -> Optional[str]:
        """Get URL for next page."""
        if not self.has_next:
            return None
        
        url = self.request.build_absolute_uri()
        return replace_query_param(url, self.cursor_query_param, self.next_cursor)
    
    def get_previous_link(self) -> Optional[str]:
        """Get URL for previous page."""
        if not self.has_prev:
            return None
        
        url = self.request.build_absolute_uri()
        return replace_query_param(url, self.cursor_query_param, self.prev_cursor)
    
    def get_page_size(self, request: Request) -> int:
        """Get page size from request or default."""
        if self.page_size_query_param:
            try:
                page_size = int(request.query_params.get(
                    self.page_size_query_param,
                    self.page_size
                ))
                if page_size > 0:
                    return min(page_size, self.max_page_size)
            except (ValueError, TypeError):
                pass
        return self.page_size
    
    def get_ordering(self, request: Request, queryset: QuerySet, view) -> str:
        """Get ordering from view or default."""
        if hasattr(view, 'ordering'):
            return view.ordering
        return self.ordering
    
    def _get_ordering_info(self) -> Tuple[str, bool]:
        """Get ordering field name and direction."""
        ordering = self.ordering
        if ordering.startswith('-'):
            return ordering[1:], True
        return ordering, False
    
    def _get_position_value(self, item: Any, field: str) -> Any:
        """Get position value from item."""
        value = getattr(item, field)
        
        # Convert datetime to ISO string for JSON serialization
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        
        return value
    
    def encode_cursor(self, cursor_data: Dict) -> str:
        """Encode cursor data to string."""
        json_str = json.dumps(cursor_data, default=str)
        return base64.urlsafe_b64encode(json_str.encode()).decode()
    
    def decode_cursor(self, request: Request) -> Optional[Dict]:
        """Decode cursor from request."""
        cursor_str = request.query_params.get(self.cursor_query_param)
        if not cursor_str:
            return None
        
        try:
            json_str = base64.urlsafe_b64decode(cursor_str.encode()).decode()
            return json.loads(json_str)
        except Exception:
            return None


class KeysetPagination(CursorPagination):
    """
    Keyset pagination using multiple columns.
    
    Useful when you need to paginate by composite keys
    or multiple ordering fields.
    
    Usage:
        class MyPagination(KeysetPagination):
            ordering_fields = ['-created_at', 'id']
    """
    
    ordering_fields = ['-created_at', 'id']
    
    def paginate_queryset(
        self,
        queryset: QuerySet,
        request: Request,
        view=None
    ) -> Optional[List]:
        """Paginate using keyset pagination."""
        self.page_size = self.get_page_size(request)
        if not self.page_size:
            return None
        
        self.request = request
        
        # Decode cursor
        cursor = self.decode_cursor(request)
        
        # Apply cursor filter
        if cursor and cursor.get('values'):
            queryset = self._apply_keyset_filter(queryset, cursor)
        
        # Apply ordering
        queryset = queryset.order_by(*self.ordering_fields)
        
        # Fetch results
        results = list(queryset[:self.page_size + 1])
        
        self.has_next = len(results) > self.page_size
        if self.has_next:
            results = results[:self.page_size]
        
        self.has_prev = cursor is not None
        
        # Generate cursors
        if results:
            last_item = results[-1]
            self.next_cursor = self._encode_keyset_cursor(last_item)
            
            if self.has_prev:
                first_item = results[0]
                self.prev_cursor = self._encode_keyset_cursor(first_item, reverse=True)
        
        return results
    
    def _apply_keyset_filter(self, queryset: QuerySet, cursor: Dict) -> QuerySet:
        """Apply keyset filter based on cursor values."""
        from django.db.models import Q
        
        values = cursor.get('values', {})
        reverse = cursor.get('reverse', False)
        
        # Build compound filter
        filters = Q()
        
        for i, field_spec in enumerate(self.ordering_fields):
            is_desc = field_spec.startswith('-')
            field = field_spec[1:] if is_desc else field_spec
            
            if field not in values:
                continue
            
            value = values[field]
            
            # Build the filter for this level
            if reverse:
                op = 'lt' if is_desc else 'gt'
            else:
                op = 'gt' if is_desc else 'lt'
            
            # For compound keys, we need: (a > val_a) OR (a = val_a AND b > val_b)
            level_filter = Q(**{f'{field}__{op}': value})
            
            # Add equality conditions for previous fields
            for prev_field_spec in self.ordering_fields[:i]:
                prev_field = prev_field_spec[1:] if prev_field_spec.startswith('-') else prev_field_spec
                if prev_field in values:
                    level_filter &= Q(**{prev_field: values[prev_field]})
            
            filters |= level_filter
        
        return queryset.filter(filters)
    
    def _encode_keyset_cursor(self, item: Any, reverse: bool = False) -> str:
        """Encode cursor from item values."""
        values = {}
        
        for field_spec in self.ordering_fields:
            field = field_spec[1:] if field_spec.startswith('-') else field_spec
            value = getattr(item, field)
            
            if hasattr(value, 'isoformat'):
                value = value.isoformat()
            
            values[field] = value
        
        return self.encode_cursor({'values': values, 'reverse': reverse})


# Pagination classes with common configurations
class StandardCursorPagination(CursorPagination):
    """Standard cursor pagination with 20 items per page."""
    page_size = 20
    ordering = '-created_at'


class LargeCursorPagination(CursorPagination):
    """Cursor pagination for larger result sets."""
    page_size = 50
    max_page_size = 200
    ordering = '-created_at'


class PipelineRunPagination(CursorPagination):
    """Pagination for pipeline runs."""
    page_size = 25
    ordering = '-created_at'


class QueryHistoryPagination(CursorPagination):
    """Pagination for query history."""
    page_size = 50
    ordering = '-created_at'

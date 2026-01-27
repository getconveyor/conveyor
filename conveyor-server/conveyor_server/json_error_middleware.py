"""
JSON Error Middleware

Handles exceptions that occur OUTSIDE Django REST Framework views:
- HTTP 404s from URL routing (no matching endpoint)
- Unhandled exceptions from non-API endpoints or middleware
- Any exception not caught by DRF's exception handler

Placed at the end of the middleware chain to catch everything that falls through.

Note: DRF exceptions within API views are handled by the custom_exception_handler
(see exception_handler.py)
"""
from django.http import JsonResponse
from django.conf import settings
import traceback
import logging

logger = logging.getLogger(__name__)


class JsonErrorMiddleware:
    """
    Middleware that converts 404 and 500 responses to JSON instead of HTML.
    
    This catches exceptions that occur outside of DRF views and ensures
    all error responses are JSON when DEBUG=True.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            response = self.get_response(request)
            
            # Convert 404 responses to JSON
            if response.status_code == 404:
                return JsonResponse({
                    "success": False,
                    "status_code": 404,
                    "error": "Not found",
                    "detail": f"The requested URL {request.path} was not found."
                }, status=404)
            
            return response
        except Exception as exc:
            # Handle unhandled exceptions that fall through to middleware
            error_detail = {
                "success": False,
                "status_code": 500,
                "error": "Internal server error"
            }
            
            if settings.DEBUG:
                error_detail['exception'] = str(exc)
                error_detail['exception_type'] = exc.__class__.__name__
                error_detail['traceback'] = traceback.format_exc()
                logger.error(f"Unhandled exception: {exc}", exc_info=True)
            else:
                logger.error(f"Unhandled exception: {exc.__class__.__name__}")
            
            return JsonResponse(error_detail, status=500)

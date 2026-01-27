"""
DRF Exception Handler

Handles exceptions that occur WITHIN Django REST Framework views.
This includes validation errors, permission denied, not found (in API views), etc.

Note: HTTP 404s from URL routing and unhandled exceptions are caught by
JsonErrorMiddleware (see json_error_middleware.py)
"""
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that formats all API exceptions as JSON.
    
    When DEBUG=True, includes detailed error information (exception type, traceback).
    When DEBUG=False, returns generic error message (production-safe).
    
    This handler is called by DRF for exceptions raised within API views.
    URL routing 404s and unhandled exceptions are handled by JsonErrorMiddleware.
    """
    # Call DRF's default handler first
    response = exception_handler(exc, context)

    # If DRF handled the exception, format it consistently
    if response is not None:
        return Response({
            "success": False,
            "status_code": response.status_code,
            "error": response.data
        }, status=response.status_code)

    # If DRF did NOT handle it, this shouldn't happen in normal operation
    # (JsonErrorMiddleware will catch it), but handle gracefully
    error_detail = {
        "success": False,
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "error": "Internal server error"
    }
    
    if settings.DEBUG:
        error_detail['exception'] = str(exc)
        error_detail['exception_type'] = exc.__class__.__name__
        error_detail['traceback'] = traceback.format_exc()
        logger.error(f"Unhandled exception in DRF: {exc}", exc_info=True)
    else:
        logger.error(f"Unhandled exception: {exc.__class__.__name__}")
    
    return Response(error_detail, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

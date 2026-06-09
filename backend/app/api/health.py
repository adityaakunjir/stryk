"""
STRYK Backend - Health Check Router

Provides a simple health endpoint for monitoring and hosting health checks.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Return service health status."""
    return {"status": "ok", "service": "stryk-backend"}


@router.get("/sentry-test")
async def trigger_error():
    """Trigger a test exception for Sentry verification."""
    # This will raise a ZeroDivisionError, which is an unhandled exception that Sentry will capture.
    division_by_zero = 1 / 0
    return {"result": division_by_zero}


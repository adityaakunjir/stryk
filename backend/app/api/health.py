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

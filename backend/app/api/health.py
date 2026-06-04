"""
STRYK Backend - Health Check Router

Provides a simple health endpoint for monitoring and Railway health checks.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Return service health status."""
    return {"status": "healthy", "service": "stryk-backend"}

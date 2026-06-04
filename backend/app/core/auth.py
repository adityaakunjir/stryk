"""STRYK Backend - authentication dependency.

Clerk is the official identity provider. This dependency keeps a temporary
development JWT/mock fallback until the full Clerk token verifier is wired into
every environment.
"""

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

security = HTTPBearer(auto_error=False)


def _demo_user() -> dict[str, Any]:
    return {
        "sub": "user_demo12345",
        "email": "demo@stryk.app",
        "name": "Demo Player",
        "username": "demoplayer",
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    """Return the authenticated user payload.

    Development allows missing or mock tokens so the frontend/backend can boot
    before the full email/password auth module exists. Production requires a
    valid JWT signed with JWT_SECRET_KEY.
    """
    if credentials is None:
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )
        return _demo_user()

    token = credentials.credentials
    if token.startswith("mock_") and not settings.is_production:
        user = _demo_user()
        user["sub"] = token.split("_", 1)[1] or user["sub"]
        return user

    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

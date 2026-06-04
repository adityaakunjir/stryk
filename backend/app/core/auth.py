"""
STRYK Backend - Clerk JWT Authentication

Validates Clerk-issued JWT tokens from the frontend to
identify and authenticate users on protected API routes.
"""

from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError
import httpx

from app.core.config import settings

security = HTTPBearer()

# Cache the JWKS keys in memory
_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    """Fetch Clerk's JWKS (JSON Web Key Set) for verifying JWTs."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not settings.clerk_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk JWKS URL not configured",
        )

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.clerk_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    """
    FastAPI dependency to extract and verify the Clerk user from
    the Authorization Bearer token.

    Returns the decoded JWT payload containing user information.
    """
    token = credentials.credentials

    # Fallback to Mock Auth if Clerk is not configured or token is a mock token
    if not settings.clerk_jwks_url or token.startswith("mock_"):
        sub = "user_demo12345"
        if token.startswith("mock_"):
            parts = token.split("_", 1)
            if len(parts) > 1:
                sub = parts[1]
        return {
            "sub": sub,
            "email": "demo@stryk.app",
            "name": "Demo Player",
            "username": "demoplayer"
        }

    try:
        jwks = await _get_jwks()

        # Decode token header to get the key id (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key in JWKS
        rsa_key = None
        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                rsa_key = jwk.construct(key_data)
                break

        if rsa_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find matching key for token verification",
            )

        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            rsa_key.to_pem().decode("utf-8"),
            algorithms=["RS256"],
            options={"verify_aud": False},
        )

        return payload

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify authentication. Please try again.",
        )

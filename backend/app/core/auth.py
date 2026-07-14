"""STRYK Backend - authentication dependency.

Clerk is the official identity provider. This dependency fetches the Clerk JWKS
(JSON Web Key Set) using the Clerk Publishable Key (or fallback) to securely
verify the RS256 JWT tokens.
"""

from typing import Any
import base64
import httpx

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


# Cache the JWKS so we don't hit Clerk's API on every request
_jwks_cache = None

async def get_clerk_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
        
    url = settings.clerk_jwks_url
    
    # Dynamically derive the JWKS URL from the publishable key if not explicitly set
    if not url and settings.clerk_publishable_key:
        try:
            key = settings.clerk_publishable_key.split("_", 2)[-1]
            key += "=" * ((4 - len(key) % 4) % 4)
            domain = base64.b64decode(key).decode('utf-8')
            if domain.endswith('$'):
                domain = domain[:-1]
            url = f"https://{domain}/.well-known/jwks.json"
        except Exception:
            pass
            
    if not url:
        # Fallback to the known local development Clerk domain
        url = "https://accurate-narwhal-70.clerk.accounts.dev/.well-known/jwks.json"
        
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10.0)
        r.raise_for_status()
        _jwks_cache = r.json()
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    """Return the authenticated user payload.
    
    Verifies the JWT token securely using Clerk's RS256 public keys.
    """
    if credentials is None:
        if settings.allow_demo_auth :
            return _demo_user()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials
    if token.startswith("mock_") and settings.allow_demo_auth :
        user = _demo_user()
        user["sub"] = token.split("_", 1)[1] or user["sub"]
        return user

    try:
        # 1. Decode the unverified header to get the Key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        
        # 2. Fetch the Clerk public keys (JWKS)
        jwks = await get_clerk_jwks()
        
        # 3. Find the RSA key that matches the kid
        rsa_key = {}
        if "keys" in jwks:
            for key in jwks["keys"]:
                if key["kid"] == unverified_header.get("kid"):
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break
                    
        if not rsa_key:
            raise JWTError("Unable to find appropriate key in JWKS")
            
        # 4. Verify and decode the payload
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Bypass audience check for flexibility, we care about signature
        )
        return payload
        
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(exc)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying token: {str(exc)}"
        )

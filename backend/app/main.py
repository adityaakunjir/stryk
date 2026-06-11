"""
STRYK Backend - FastAPI Application Entry Point

Sets up the FastAPI app with CORS, routers, Sentry, and PostHog.
Run with: uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_db_tables
import app.models  # Important: Register all models with SQLModel before DB creation
from app.api.health import router as health_router
from app.api.players import router as players_router
from app.api.balance import router as balance_router


# ─── Sentry (Error Monitoring) ────────────────────────────────────
if settings.sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            traces_sample_rate=0.2 if settings.is_production else 1.0,
            profiles_sample_rate=0.1,
            environment=settings.app_env,
            send_default_pii=True,
        )
    except ImportError:
        pass


# ─── PostHog (Analytics) ──────────────────────────────────────────
posthog_client = None
if settings.posthog_api_key:
    try:
        import posthog
        posthog.project_api_key = settings.posthog_api_key
        posthog.host = settings.posthog_host
        posthog_client = posthog
    except ImportError:
        pass


# ─── Cloudinary ───────────────────────────────────────────────────
if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
    import cloudinary
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )



# ─── Lifespan Events ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup
    await create_db_tables()
    yield
    # Shutdown
    if posthog_client:
        posthog_client.shutdown()


# ─── App Instance ─────────────────────────────────────────────────
app = FastAPI(
    title="STRYK API",
    description="Backend API for the STRYK football platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
)


# ─── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "https://stryk.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ──────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(players_router, prefix="/api/v1")
app.include_router(balance_router, prefix="/api/v1")

from app.api.teams import router as teams_router
from app.api.matches import router as matches_router
from app.api.search import router as search_router
from app.api.profile import router as profile_router
from app.api.ai import router as ai_router
from app.api.friends import router as friends_router

app.include_router(teams_router, prefix="/api/v1")
app.include_router(matches_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(friends_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1/ai")


# ─── Root ──────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "STRYK API",
        "version": "0.1.0",
        "docs": "/docs" if settings.app_debug else "disabled",
    }


@app.get("/test-gemini")
async def test_gemini():
    import os
    return {"key_found": bool(os.getenv("GEMINI_API_KEY") or settings.gemini_api_key or settings.google_api_key)}

"""
STRYK Backend - Application Settings

Loads environment variables from .env and provides typed access
to all configuration values across the application.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_env: str = "development"
    app_debug: bool = True

    # --- Database (Supabase PostgreSQL) ---
    database_url: str = ""

    # --- Clerk (Auth) ---
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_jwks_url: str = ""

    # --- OpenAI ---
    openai_api_key: str = ""

    # --- Google Gemini ---
    google_api_key: str = ""

    # --- Replicate ---
    replicate_api_token: str = ""

    # --- Cloudinary ---
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # --- Sentry ---
    sentry_dsn: str = ""

    # --- PostHog ---
    posthog_api_key: str = ""
    posthog_host: str = "https://us.i.posthog.com"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()

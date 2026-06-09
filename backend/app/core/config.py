"""
STRYK Backend - Application Settings

Loads environment variables from .env and provides typed access
to all configuration values across the application.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_env: str = Field(default="development", validation_alias="APP_ENV")
    app_debug: bool = Field(default=True, validation_alias="APP_DEBUG")

    # --- Database ---
    database_url: str = Field(default="", validation_alias="DATABASE_URL")

    # --- Auth ---
    clerk_secret_key: str = Field(default="", validation_alias="CLERK_SECRET_KEY")
    clerk_publishable_key: str = Field(default="", validation_alias="CLERK_PUBLISHABLE_KEY")
    clerk_jwks_url: str = Field(default="", validation_alias="CLERK_JWKS_URL")
    jwt_secret_key: str = Field(default="dev-secret-change-me", validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    # --- OpenAI ---
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")

    # --- Google Gemini ---
    google_api_key: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")

    # --- Replicate ---
    replicate_api_token: str = Field(default="", validation_alias="REPLICATE_API_TOKEN")

    # --- Azure Blob Storage ---
    azure_storage_connection_string: str = Field(default="", validation_alias="AZURE_STORAGE_CONNECTION_STRING")
    azure_storage_container: str = Field(default="player-media", validation_alias="AZURE_STORAGE_CONTAINER")

    # --- Sentry ---
    sentry_dsn: str = Field(default="", validation_alias="SENTRY_DSN")

    # --- PostHog ---
    posthog_api_key: str = Field(default="", validation_alias="POSTHOG_API_KEY")
    posthog_host: str = Field(default="https://us.i.posthog.com", validation_alias="POSTHOG_HOST")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()

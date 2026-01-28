"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(env_file=".env")

    # Database
    database_url: str = "postgresql+asyncpg://localhost/nanobanana"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Google Gemini
    google_api_key: str = ""

    # R2 Storage
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket: str = "nanobanana-images"
    r2_endpoint: str = ""

    # Auth
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week


settings = Settings()

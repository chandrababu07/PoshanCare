import json
from typing import Any, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings derived from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # General Configuration
    PROJECT_NAME: str = "PoshanCare API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./poshancare.db"

    # Security & Authentication Settings
    SECRET_KEY: str = "poshancare_dev_secret_key_change_in_production_min_32_chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # False for HTTP localhost development; True in Production HTTPS
    COOKIE_SAMESITE: str = "lax"
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    ENABLE_SECURITY_HEADERS: bool = True

    # Google OAuth 2.0 Settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # CORS Whitelist Origins
    CORS_ORIGINS: Union[str, list[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        """Parse string JSON or comma-separated CORS origins into a list of strings."""
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return [str(item).strip() for item in value]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    def validate_production_config(self) -> None:
        """Validate production settings to fail fast on weak or default configuration (HR-3)."""
        if self.ENVIRONMENT == "production":
            insecure_defaults = [
                "poshancare_dev_secret_key_change_in_production_min_32_chars",
                "replace_with_a_secure_random_32_character_string_in_production",
                "secret",
                "changeme",
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "Production configuration error: SECRET_KEY must be set to a secure, non-default string of at least 32 characters when ENVIRONMENT=production."
                )
            if not self.DATABASE_URL or "sqlite" in self.DATABASE_URL.lower():
                raise ValueError(
                    "Production configuration error: DATABASE_URL must be set to a production-grade database (e.g. PostgreSQL) and cannot use SQLite when ENVIRONMENT=production."
                )


settings = Settings()


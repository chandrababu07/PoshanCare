import pytest
from httpx import AsyncClient
from app.core.config import settings


@pytest.mark.asyncio
async def test_security_headers(client: AsyncClient):
    """Verify that all production HTTP security headers are injected in API responses."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    
    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "strict-transport-security" in headers


@pytest.mark.asyncio
async def test_cors_configuration():
    """Verify CORS whitelist configuration parser handles strings and lists."""
    cors_list = settings.CORS_ORIGINS
    assert isinstance(cors_list, list)
    assert len(cors_list) > 0


@pytest.mark.asyncio
async def test_root_metadata_endpoint(client: AsyncClient):
    """Verify root application metadata endpoint format."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == settings.PROJECT_NAME
    assert data["status"] == "online"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_validate_production_config_fail_fast():
    """Verify that validate_production_config fails fast on weak secret key or SQLite in production."""
    # Test weak secret key failure
    settings.ENVIRONMENT = "production"
    settings.SECRET_KEY = "weak_secret"
    settings.DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/db"

    with pytest.raises(ValueError, match="SECRET_KEY must be set to a secure"):
        settings.validate_production_config()

    # Test SQLite in production failure
    settings.SECRET_KEY = "a_very_secure_production_secret_key_with_sufficient_length_12345"
    settings.DATABASE_URL = "sqlite+aiosqlite:///./test.db"

    with pytest.raises(ValueError, match="cannot use SQLite"):
        settings.validate_production_config()

    # Restore development environment settings
    settings.ENVIRONMENT = "development"
    settings.SECRET_KEY = "poshancare_dev_secret_key_change_in_production_min_32_chars"
    settings.DATABASE_URL = "sqlite+aiosqlite:///./poshancare.db"


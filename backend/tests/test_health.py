import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Verify root endpoint returns app metadata."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "PoshanCare API"
    assert data["status"] == "online"
    assert data["api_v1"] == "/api/v1/health"


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Verify /api/v1/health returns HTTP 200 with healthy status."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert "environment" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_database_health_endpoint(client: AsyncClient):
    """Verify /api/v1/health/db returns HTTP 200 with database connection details."""
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["record_count"] >= 1
    assert "dialect" in data
    assert "timestamp" in data

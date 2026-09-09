import pytest
from httpx import AsyncClient


async def get_auth_cookies(client: AsyncClient, email: str) -> dict:
    """Helper to register user and return auth cookies."""
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Analytics Test User",
    })
    assert reg_res.status_code == 201
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthenticated_analytics(client: AsyncClient):
    """Unauthenticated GET /api/v1/analytics/dashboard must return 401."""
    res = await client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_empty_analytics_dataset(client: AsyncClient):
    """New user with no weight/diary data receives predictable dashboard response."""
    cookies = await get_auth_cookies(client, "empty_analytics@poshancare.in")

    res = await client.get("/api/v1/analytics/dashboard?period=30d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["period"] == "30d"
    assert data["days_in_period"] == 30
    assert "overview" in data
    assert "weight" in data
    assert "calories" in data
    assert "macros" in data
    assert "consistency" in data
    assert "insights" in data
    assert isinstance(data["insights"], list)
    assert len(data["insights"]) >= 1


@pytest.mark.asyncio
async def test_analytics_with_data(client: AsyncClient):
    """User with weight logs and diary telemetry receives complete calculated analytics."""
    cookies = await get_auth_cookies(client, "telemetry_user@poshancare.in")

    # 1. Log weight
    await client.post("/api/v1/weight", json={"date": "2026-09-01", "weight_kg": 70.0}, cookies=cookies)
    await client.post("/api/v1/weight", json={"date": "2026-09-07", "weight_kg": 70.8}, cookies=cookies)

    # 2. Fetch dashboard analytics
    res = await client.get("/api/v1/analytics/dashboard?period=14d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["period"] == "14d"
    assert data["days_in_period"] == 14
    assert data["weight"]["start_weight"] == 70.0
    assert data["weight"]["current_weight"] == 70.8
    assert data["weight"]["total_change_kg"] == 0.8
    assert data["weight"]["trend_direction"] == "increasing"
    assert "comparisons" in data
    assert "weight" in data["comparisons"]


@pytest.mark.asyncio
async def test_period_parameters(client: AsyncClient):
    """Test valid period selections (7d, 14d, 30d, 90d, 6m, 1y)."""
    cookies = await get_auth_cookies(client, "periods_user@poshancare.in")

    for period, expected_days in [
        ("7d", 7),
        ("14d", 14),
        ("30d", 30),
        ("90d", 90),
        ("6m", 180),
        ("1y", 365),
    ]:
        res = await client.get(f"/api/v1/analytics/dashboard?period={period}", cookies=cookies)
        assert res.status_code == 200
        assert res.json()["days_in_period"] == expected_days


@pytest.mark.asyncio
async def test_invalid_period_rejected(client: AsyncClient):
    """Invalid period query string must return 422 Unprocessable Entity."""
    cookies = await get_auth_cookies(client, "invalid_period@poshancare.in")

    res = await client.get("/api/v1/analytics/dashboard?period=invalid_period", cookies=cookies)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_cross_user_analytics_isolation(client: AsyncClient):
    """Verify strict user isolation so User B cannot view User A's analytics."""
    cookies_a = await get_auth_cookies(client, "user_a_analytics@poshancare.in")
    cookies_b = await get_auth_cookies(client, "user_b_analytics@poshancare.in")

    # User A logs weight 85kg
    await client.post("/api/v1/weight", json={"date": "2026-09-05", "weight_kg": 85.0}, cookies=cookies_a)

    # User B checks analytics
    res_b = await client.get("/api/v1/analytics/dashboard?period=30d", cookies=cookies_b)
    assert res_b.status_code == 200
    # User B should not see 85kg
    assert res_b.json()["weight"]["current_weight"] != 85.0

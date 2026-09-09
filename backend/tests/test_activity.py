import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Activity Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthenticated_activity_rejected(client: AsyncClient):
    """Test 401 Unauthorized for unauthenticated GET/POST activity requests."""
    res_get = await client.get("/api/v1/activity")
    assert res_get.status_code == 401

    res_post = await client.post("/api/v1/activity", json={"date": "2026-09-09", "steps": 5000})
    assert res_post.status_code == 401


@pytest.mark.asyncio
async def test_empty_activity_state_distinct_from_zero_steps(client: AsyncClient):
    """Test GET /api/v1/activity returns has_activity_data=False when no activity logged."""
    cookies = await register_and_login(client, "empty_act_user@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    res = await client.get(f"/api/v1/activity?date={today_str}", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["has_activity_data"] is False
    assert data["log"] is None


@pytest.mark.asyncio
async def test_upsert_activity_log_creation_and_update(client: AsyncClient):
    """Test creating and updating daily activity log record."""
    cookies = await register_and_login(client, "act_upsert_user@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Create activity record
    create_res = await client.post("/api/v1/activity", json={
        "date": today_str,
        "activity_level": "Moderately Active",
        "steps": 4500,
        "active_minutes": 45,
        "exercise_minutes": 30,
        "activity_type": "Bisk Walking",
    }, cookies=cookies)

    assert create_res.status_code == 200
    data = create_res.json()
    assert data["steps"] == 4500
    assert data["activity_level"] == "Moderately Active"

    # 2. Update existing activity record for same date
    update_res = await client.post("/api/v1/activity", json={
        "date": today_str,
        "steps": 7200,
        "exercise_minutes": 45,
    }, cookies=cookies)

    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["steps"] == 7200
    assert updated_data["exercise_minutes"] == 45


@pytest.mark.asyncio
async def test_negative_activity_values_rejected(client: AsyncClient):
    """Test 422 Unprocessable Entity for negative steps or minutes."""
    cookies = await register_and_login(client, "negative_act_user@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    res1 = await client.post("/api/v1/activity", json={"date": today_str, "steps": -500}, cookies=cookies)
    assert res1.status_code == 422

    res2 = await client.post("/api/v1/activity", json={"date": today_str, "active_minutes": -30}, cookies=cookies)
    assert res2.status_code == 422


@pytest.mark.asyncio
async def test_user_activity_isolation(client: AsyncClient):
    """Test user data isolation — User A cannot view User B's activity record."""
    cookies_a = await register_and_login(client, "user_a_act@poshancare.in")
    cookies_b = await register_and_login(client, "user_b_act@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # User A logs steps
    await client.post("/api/v1/activity", json={"date": today_str, "steps": 8500}, cookies=cookies_a)

    # User B queries activity
    res_b = await client.get(f"/api/v1/activity?date={today_str}", cookies=cookies_b)
    assert res_b.status_code == 200
    data_b = res_b.json()

    assert data_b["has_activity_data"] is False
    assert data_b["log"] is None


@pytest.mark.asyncio
async def test_activity_history_timeline(client: AsyncClient):
    """Test GET /api/v1/activity/history timeline aggregation."""
    cookies = await register_and_login(client, "act_history_user@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await client.post("/api/v1/activity", json={"date": today_str, "steps": 6000}, cookies=cookies)

    res = await client.get("/api/v1/activity/history?period=30d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["period"] == "30d"
    assert data["logged_days_count"] == 1
    assert data["avg_steps"] == 6000.0
    assert len(data["logs"]) == 1

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Analytics Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_analytics_availability_flags_and_zero_fabricated_data(client: AsyncClient):
    """Test analytics dashboard response availability flags for brand new user with ZERO fake data."""
    cookies = await register_and_login(client, "zero_fake_analytics@poshancare.in")

    res = await client.get("/api/v1/analytics/dashboard?period=30d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["has_weight_data"] is False
    assert data["has_diary_data"] is False
    assert data["has_activity_data"] is False
    assert data["has_hydration_data"] is False
    assert data["logged_days_count"] == 0
    assert data["activity_logged_days"] == 0
    assert data["hydration_logged_days"] == 0
    assert data["avg_daily_water_ml"] is None
    assert data["avg_daily_steps"] is None


@pytest.mark.asyncio
async def test_analytics_reflects_real_activity_and_hydration(client: AsyncClient):
    """Test analytics dashboard reflects actual logged activity and hydration telemetry."""
    cookies = await register_and_login(client, "real_act_hyd_analytics@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Add water & activity
    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 750}, cookies=cookies)
    await client.post("/api/v1/activity", json={"date": today_str, "steps": 5400}, cookies=cookies)

    res = await client.get("/api/v1/analytics/dashboard?period=30d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["has_hydration_data"] is True
    assert data["has_activity_data"] is True
    assert data["hydration_logged_days"] == 1
    assert data["activity_logged_days"] == 1
    assert data["avg_daily_water_ml"] == 750.0
    assert data["avg_daily_steps"] == 5400.0


@pytest.mark.asyncio
async def test_child_persona_hydration_and_activity_safety(client: AsyncClient):
    """Test Child persona receives positive movement and hydration insights with NO weight-loss/deficit language."""
    cookies = await register_and_login(client, "child_phase_2_3@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await client.patch("/api/v1/profile", json={
        "profile_type": "child",
        "age": 9,
        "height_cm": 135.0,
        "weight_kg": 30.0,
    }, cookies=cookies)

    # Log water & steps
    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 600}, cookies=cookies)
    await client.post("/api/v1/activity", json={"date": today_str, "steps": 7000}, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    for insight in data["insights"]:
        text = (insight["title"] + " " + insight["message"]).lower()
        assert "deficit" not in text
        assert "restriction" not in text
        assert "weight loss" not in text
        assert "fat loss" not in text


@pytest.mark.asyncio
async def test_teen_persona_hydration_and_activity_safety(client: AsyncClient):
    """Test Teen persona avoids calorie-deficit framing."""
    cookies = await register_and_login(client, "teen_phase_2_3@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await client.patch("/api/v1/profile", json={
        "profile_type": "teen",
        "age": 16,
        "height_cm": 168.0,
        "weight_kg": 58.0,
    }, cookies=cookies)

    await client.post("/api/v1/activity", json={"date": today_str, "steps": 8000}, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    for insight in data["insights"]:
        text = (insight["title"] + " " + insight["message"]).lower()
        assert "calorie deficit" not in text


@pytest.mark.asyncio
async def test_older_adult_hydration_and_movement_focus(client: AsyncClient):
    """Test Older Adult persona insights emphasize hydration and active mobility."""
    cookies = await register_and_login(client, "elder_phase_2_3@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    await client.patch("/api/v1/profile", json={
        "profile_type": "older_adult",
        "age": 72,
        "height_cm": 158.0,
        "weight_kg": 60.0,
    }, cookies=cookies)

    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 1200}, cookies=cookies)
    await client.post("/api/v1/activity", json={"date": today_str, "steps": 3500}, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    insights_text = " ".join([i["title"] + " " + i["message"] for i in data["insights"]]).lower()
    assert "hydration" in insights_text or "fluid" in insights_text or "movement" in insights_text

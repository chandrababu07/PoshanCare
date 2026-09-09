from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.activity import ActivityLog
from app.models.hydration import WaterLog
from app.models.profile import UserProfile
from app.models.user import User


async def register_and_login(client: AsyncClient, email: str, name: str = "Health User") -> dict:
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": name,
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_health_overview_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/analytics/health-overview")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_overview_authenticated_new_user(client: AsyncClient):
    cookies = await register_and_login(client, "newhealthuser@example.com")
    response = await client.get("/api/v1/analytics/health-overview?period=7d", cookies=cookies)
    assert response.status_code == 200

    data = response.json()
    assert data["period"] == "7d"
    assert data["days_in_period"] == 7

    avail = data["data_availability"]
    assert avail["has_nutrition_today"] is False
    assert avail["has_hydration_today"] is False
    assert avail["has_activity_today"] is False

    today = data["today"]
    assert today["calories"] == 0.0
    assert today["water_ml"] == 0
    assert today["steps"] is None
    assert today["active_minutes"] is None

    persona = data["persona"]
    assert persona["profile_type"] == "adult"


@pytest.mark.asyncio
async def test_health_overview_user_isolation(
    client: AsyncClient,
    db_session: AsyncSession,
):
    cookies_a = await register_and_login(client, "user_a_health@example.com", "User A")
    cookies_b = await register_and_login(client, "user_b_health@example.com", "User B")

    # Get User B id
    res_b_user = await db_session.execute(select(User).where(User.email == "user_b_health@example.com"))
    user_b = res_b_user.scalar_one()

    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user_b.id, date=now, amount_ml=1200)
    db_session.add(w_log)
    await db_session.commit()

    # Query health overview as User A
    res = await client.get("/api/v1/analytics/health-overview", cookies=cookies_a)
    assert res.status_code == 200

    data = res.json()
    assert data["today"]["water_ml"] == 0
    assert data["data_availability"]["has_hydration_today"] is False


@pytest.mark.asyncio
async def test_health_overview_child_persona_safety(
    client: AsyncClient,
    db_session: AsyncSession,
):
    cookies = await register_and_login(client, "child_health@example.com", "Child User")
    res_user = await db_session.execute(select(User).where(User.email == "child_health@example.com"))
    user_child = res_user.scalar_one()

    prof = UserProfile(
        user_id=user_child.id,
        profile_type="child",
        age=9,
        biological_sex="male",
        height_cm=132.0,
        weight_kg=28.0,
        activity_level="Moderately Active",
    )
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/analytics/health-overview", cookies=cookies)
    assert res.status_code == 200

    data = res.json()
    persona = data["persona"]
    assert persona["profile_type"] == "child"
    assert "Growth" in persona["headline"]

    raw_json_str = res.text.lower()
    assert "calorie deficit" not in raw_json_str
    assert "weight loss" not in raw_json_str
    assert "fat loss" not in raw_json_str


@pytest.mark.asyncio
async def test_health_overview_with_telemetry_data(
    client: AsyncClient,
    db_session: AsyncSession,
):
    cookies = await register_and_login(client, "telemetry_user@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "telemetry_user@example.com"))
    user = res_user.scalar_one()

    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user.id, date=now, amount_ml=750)
    a_log = ActivityLog(
        user_id=user.id,
        date=now,
        activity_level="Moderately Active",
        steps=5400,
        active_minutes=45,
    )
    db_session.add_all([w_log, a_log])
    await db_session.commit()

    res = await client.get("/api/v1/analytics/health-overview?period=7d", cookies=cookies)
    assert res.status_code == 200

    data = res.json()
    assert data["today"]["water_ml"] == 750
    assert data["today"]["steps"] == 5400
    assert data["today"]["active_minutes"] == 45
    assert data["data_availability"]["has_hydration_today"] is True
    assert data["data_availability"]["has_activity_today"] is True

    trends = data["weekly_trends"]
    assert len(trends["days"]) == 7
    assert trends["avg_daily_water_ml"] == 750.0
    assert trends["avg_daily_steps"] == 5400.0

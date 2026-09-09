from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.activity import ActivityLog
from app.models.hydration import WaterLog
from app.models.profile import UserProfile
from app.models.user import User
from app.models.weight import WeightLog


async def register_and_login(client: AsyncClient, email: str, name: str = "Trends User") -> dict:
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
async def test_health_overview_multi_periods(client: AsyncClient):
    """Test health overview endpoints support 7d, 14d, 30d, 90d periods accurately."""
    cookies = await register_and_login(client, "multi_period@example.com")
    
    for period, expected_days in [("7d", 7), ("14d", 14), ("30d", 30), ("90d", 90)]:
        res = await client.get(f"/api/v1/analytics/health-overview?period={period}", cookies=cookies)
        assert res.status_code == 200
        data = res.json()
        assert data["period"] == period
        assert data["days_in_period"] == expected_days
        assert len(data["weekly_trends"]["days"]) == expected_days
        
        # Verify expanded DayTrendPoint schema fields exist
        first_day = data["weekly_trends"]["days"][0]
        assert "carbs_g" in first_day
        assert "fat_g" in first_day
        assert "hydration_pct" in first_day
        assert "exercise_minutes" in first_day


@pytest.mark.asyncio
async def test_health_overview_extended_day_trend_point_data(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify that extended DayTrendPoint fields contain real aggregated data."""
    cookies = await register_and_login(client, "trend_telemetry@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "trend_telemetry@example.com"))
    user = res_user.scalar_one()

    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user.id, date=now, amount_ml=2000)
    a_log = ActivityLog(
        user_id=user.id,
        date=now,
        activity_level="Active",
        steps=10000,
        active_minutes=60,
        exercise_minutes=60,
    )
    db_session.add_all([w_log, a_log])
    await db_session.commit()

    res = await client.get("/api/v1/analytics/health-overview?period=7d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    today_str = now.strftime("%Y-%m-%d")
    days = data["weekly_trends"]["days"]
    today_point = next((d for d in days if d["date"] == today_str), None)
    assert today_point is not None
    assert today_point["water_ml"] == 2000
    assert today_point["hydration_pct"] == 80.0
    assert today_point["exercise_minutes"] == 60


@pytest.mark.asyncio
async def test_report_metrics_extended_schema(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify GET /api/v1/reports/metrics returns new summaries without fake data."""
    cookies = await register_and_login(client, "report_schema@example.com", "Report Schema User")
    res_user = await db_session.execute(select(User).where(User.email == "report_schema@example.com"))
    user = res_user.scalar_one()

    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user.id, date=now, amount_ml=1500)
    a_log = ActivityLog(user_id=user.id, date=now, activity_level="Moderately Active", steps=6000, active_minutes=30)
    weight_log = WeightLog(user_id=user.id, date=now, weight_kg=72.5)
    db_session.add_all([w_log, a_log, weight_log])
    await db_session.commit()

    res = await client.get("/api/v1/reports/metrics?report_type=7day", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    # Check extended schema fields
    assert "hydrationSummary" in data
    assert "activitySummary" in data
    assert "profileType" in data
    assert "loggedDays" in data
    assert "hasRealData" in data

    assert "1500 ml" in data["hydrationSummary"]
    assert "30 active mins" in data["activitySummary"]
    assert "steps" in data["activitySummary"]
    assert data["hasRealData"] is True


@pytest.mark.asyncio
async def test_report_metrics_zero_fabrication(client: AsyncClient):
    """Verify brand new user receives zero fake numbers in reports metrics."""
    cookies = await register_and_login(client, "zero_fake@example.com")
    
    res = await client.get("/api/v1/reports/metrics?report_type=7day", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["hasRealData"] is False
    assert data["loggedDays"] == 0
    assert data["hydrationSummary"] == "No hydration logged"
    assert data["activitySummary"] == "No activity logged"
    # weeklyCalorieHistory should have 7 entries, all 0 value
    assert len(data["weeklyCalorieHistory"]) == 7
    for day in data["weeklyCalorieHistory"]:
        assert day["value"] == 0


@pytest.mark.asyncio
async def test_report_metrics_child_safety(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify child profile report metrics contain no calorie deficit/weight loss language."""
    cookies = await register_and_login(client, "child_report@example.com", "Child Report User")
    res_user = await db_session.execute(select(User).where(User.email == "child_report@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(
        user_id=user.id,
        profile_type="child",
        age=8,
        biological_sex="female",
        height_cm=125.0,
        weight_kg=24.0,
        activity_level="Sedentary",
    )
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/reports/metrics?report_type=7day", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["profileType"] == "child"
    raw_str = res.text.lower()
    assert "calorie deficit" not in raw_str
    assert "weight loss" not in raw_str

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
from app.models.goal import HealthGoal
from app.models.meal_plan import MealPlan


async def register_and_login(client: AsyncClient, email: str, name: str = "Insights User") -> dict:
    """Helper to register user, login, and return auth cookies."""
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
async def test_health_insights_authenticated_access(client: AsyncClient):
    """1. Test authenticated access returns HTTP 200 OK."""
    cookies = await register_and_login(client, "auth_insights@example.com")
    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert "period" in data
    assert "data_availability" in data


@pytest.mark.asyncio
async def test_health_insights_unauthenticated_access(client: AsyncClient):
    """2. Test unauthenticated access returns HTTP 401 Unauthorized."""
    res = await client.get("/api/v1/health-insights")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_health_insights_user_isolation(client: AsyncClient, db_session: AsyncSession):
    """3 & 20. Test user isolation: User A cannot see User B's telemetry or insights."""
    cookies_a = await register_and_login(client, "user_a@example.com", "User A")
    cookies_b = await register_and_login(client, "user_b@example.com", "User B")

    res_b = await db_session.execute(select(User).where(User.email == "user_b@example.com"))
    user_b = res_b.scalar_one()

    # Add water log for User B
    now = datetime.now(timezone.utc)
    w_b = WaterLog(user_id=user_b.id, date=now, amount_ml=3000)
    db_session.add(w_b)
    await db_session.commit()

    # User A requests health insights
    res_a = await client.get("/api/v1/health-insights", cookies=cookies_a)
    assert res_a.status_code == 200
    data_a = res_a.json()

    # User A should NOT see User B's hydration data
    assert data_a["data_availability"]["has_hydration_data"] is False
    assert data_a["summary"]["hydration"]["avg_value"] is None

    # User B requests health insights
    res_b_api = await client.get("/api/v1/health-insights", cookies=cookies_b)
    assert res_b_api.status_code == 200
    data_b = res_b_api.json()
    assert data_b["data_availability"]["has_hydration_data"] is True
    assert data_b["summary"]["hydration"]["avg_value"] == 3000.0


@pytest.mark.asyncio
async def test_health_insights_empty_new_account(client: AsyncClient):
    """4, 16 & 17. Test brand new account returns zero fabricated metrics and null averages."""
    cookies = await register_and_login(client, "empty_insights@example.com")
    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    da = data["data_availability"]
    assert da["has_nutrition_data"] is False
    assert da["has_hydration_data"] is False
    assert da["has_activity_data"] is False
    assert da["has_weight_data"] is False
    assert da["has_goal_data"] is False

    summary = data["summary"]
    assert summary["nutrition"]["avg_value"] is None
    assert summary["hydration"]["avg_value"] is None
    assert summary["activity"]["avg_value"] is None
    assert summary["weight"]["latest_weight_kg"] is None
    assert summary["weight"]["change_kg"] is None


@pytest.mark.asyncio
async def test_health_insights_hydration_and_activity(
    client: AsyncClient, db_session: AsyncSession
):
    """6 & 7. Test hydration and activity insights with real DB telemetry."""
    cookies = await register_and_login(client, "hyd_act_insights@example.com")
    res_u = await db_session.execute(select(User).where(User.email == "hyd_act_insights@example.com"))
    user = res_u.scalar_one()

    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user.id, date=now, amount_ml=2200)
    a_log = ActivityLog(user_id=user.id, date=now, steps=7500, active_minutes=45)
    db_session.add_all([w_log, a_log])
    await db_session.commit()

    res = await client.get("/api/v1/health-insights?period=7d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["data_availability"]["has_hydration_data"] is True
    assert data["data_availability"]["has_activity_data"] is True
    assert data["summary"]["hydration"]["avg_value"] == 2200.0
    assert data["summary"]["activity"]["avg_value"] == 7500.0


@pytest.mark.asyncio
async def test_health_insights_goals_and_actions(
    client: AsyncClient, db_session: AsyncSession
):
    """8, 18 & 19. Test health goals summary, action generation, and valid route formats."""
    cookies = await register_and_login(client, "goals_actions@example.com")
    res_u = await db_session.execute(select(User).where(User.email == "goals_actions@example.com"))
    user = res_u.scalar_one()

    goal = HealthGoal(
        user_id=user.id,
        goal_type="hydration",
        title="Drink 2.5L Water Daily",
        target_value=2500,
        unit="ml",
        start_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        status="active",
    )
    db_session.add(goal)
    await db_session.commit()

    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["data_availability"]["has_goal_data"] is True
    assert data["summary"]["goals"]["active"] == 1

    actions = data["actions"]
    assert len(actions) >= 1
    assert len(actions) <= 5
    for action in actions:
        assert action["route"].startswith("/app")


@pytest.mark.asyncio
async def test_health_insights_trend_periods_and_null_preservation(client: AsyncClient):
    """9 & 10. Test period query parameters (7d, 14d, 30d, 90d) and missing telemetry null preservation."""
    cookies = await register_and_login(client, "periods_test@example.com")

    for period, expected_days in [("7d", 7), ("14d", 14), ("30d", 30), ("90d", 90)]:
        res = await client.get(f"/api/v1/health-insights?period={period}", cookies=cookies)
        assert res.status_code == 200
        data = res.json()
        assert data["period"] == period
        assert len(data["trend_points"]) == expected_days

        # Verify missing metrics are null
        first_pt = data["trend_points"][0]
        assert first_pt["calories"] is None
        assert first_pt["water_ml"] is None
        assert first_pt["steps"] is None
        assert first_pt["weight_kg"] is None


@pytest.mark.asyncio
async def test_health_insights_correlation_non_causal(
    client: AsyncClient, db_session: AsyncSession
):
    """11 & 12. Test correlation analysis produces observational, non-causal language."""
    cookies = await register_and_login(client, "corr_non_causal@example.com")
    res_u = await db_session.execute(select(User).where(User.email == "corr_non_causal@example.com"))
    user = res_u.scalar_one()

    now = datetime.now(timezone.utc)
    for i in range(4):
        d_obj = now - timedelta(days=i)
        w = WaterLog(user_id=user.id, date=d_obj, amount_ml=2500)
        a = ActivityLog(user_id=user.id, date=d_obj, steps=8000 + i * 100)
        db_session.add_all([w, a])
    await db_session.commit()

    res = await client.get("/api/v1/health-insights?period=7d", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    correlations = data["correlations"]
    assert len(correlations) >= 1

    for corr in correlations:
        obs = corr["observation"].lower()
        # Verify NO causal language
        assert "caused" not in obs
        assert "because" not in obs
        assert "leads to" not in obs


@pytest.mark.asyncio
async def test_child_persona_safety(client: AsyncClient, db_session: AsyncSession):
    """13. Test child persona safety enforces zero calorie-deficit/weight-loss framing."""
    cookies = await register_and_login(client, "child_safety@example.com", "Child User")
    res_u = await db_session.execute(select(User).where(User.email == "child_safety@example.com"))
    user = res_u.scalar_one()

    prof = UserProfile(
        user_id=user.id,
        profile_type="child",
        age=9,
        biological_sex="female",
        height_cm=132.0,
        weight_kg=28.0,
    )
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    raw_json_str = res.text.lower()

    assert "calorie deficit" not in raw_json_str
    assert "weight loss" not in raw_json_str
    assert "fat loss" not in raw_json_str
    assert "restriction" not in raw_json_str
    assert "eat less" not in raw_json_str


@pytest.mark.asyncio
async def test_teen_persona_safety(client: AsyncClient, db_session: AsyncSession):
    """14. Test teen persona safety avoids restrictive dieting language."""
    cookies = await register_and_login(client, "teen_safety@example.com", "Teen User")
    res_u = await db_session.execute(select(User).where(User.email == "teen_safety@example.com"))
    user = res_u.scalar_one()

    prof = UserProfile(
        user_id=user.id,
        profile_type="teen",
        age=15,
        biological_sex="male",
        height_cm=165.0,
        weight_kg=54.0,
    )
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    raw_json_str = res.text.lower()

    assert "calorie deficit" not in raw_json_str
    assert "weight loss" not in raw_json_str
    assert "restrict" not in raw_json_str


@pytest.mark.asyncio
async def test_older_adult_messaging(client: AsyncClient, db_session: AsyncSession):
    """15. Test older_adult persona messaging emphasizes hydration, muscle support, and mobility."""
    cookies = await register_and_login(client, "elder_messaging@example.com", "Elder User")
    res_u = await db_session.execute(select(User).where(User.email == "elder_messaging@example.com"))
    user = res_u.scalar_one()

    prof = UserProfile(
        user_id=user.id,
        profile_type="older_adult",
        age=72,
        biological_sex="female",
        height_cm=158.0,
        weight_kg=62.0,
    )
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/health-insights", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert data["persona"] == "older_adult"

    raw_text = res.text.lower()
    assert any(term in raw_text for term in ["hydration", "protein", "fluid", "mobility", "strength", "muscle"])

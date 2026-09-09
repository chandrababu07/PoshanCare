from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.profile import UserProfile
from app.models.user import User
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.activity import ActivityLog
from app.models.weight import WeightLog


async def register_and_login(client: AsyncClient, email: str, name: str = "Goal User") -> dict:
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


async def set_user_profile_type(db_session: AsyncSession, email: str, profile_type: str, age: int = 25):
    res_user = await db_session.execute(select(User).where(User.email == email))
    user = res_user.scalar_one()

    prof_res = await db_session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    prof = prof_res.scalar_one_or_none()
    if prof:
        prof.profile_type = profile_type
        prof.age = age
    else:
        prof = UserProfile(user_id=user.id, profile_type=profile_type, age=age)
        db_session.add(prof)
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Unauthenticated requests must return 401."""
    res1 = await client.get("/api/v1/goals")
    assert res1.status_code == 401

    res2 = await client.post("/api/v1/goals", json={
        "goal_type": "hydration",
        "title": "Drink Water",
        "target_value": 2000,
        "unit": "ml",
    })
    assert res2.status_code == 401

    res3 = await client.get("/api/v1/goals/dashboard")
    assert res3.status_code == 401


@pytest.mark.asyncio
async def test_create_and_get_goals(client: AsyncClient):
    """Test creating and retrieving user health goals."""
    cookies = await register_and_login(client, "create_goal@example.com")

    # Create Goal
    create_res = await client.post(
        "/api/v1/goals",
        json={
            "goal_type": "hydration",
            "title": "Daily Water Intake Goal",
            "description": "Drink at least 2500ml water daily",
            "target_value": 2500,
            "unit": "ml",
            "frequency": "daily",
        },
        cookies=cookies,
    )
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["title"] == "Daily Water Intake Goal"
    assert data["target_value"] == 2500.0
    assert data["status"] == "active"

    # List Goals
    list_res = await client.get("/api/v1/goals", cookies=cookies)
    assert list_res.status_code == 200
    goals = list_res.json()
    assert len(goals) == 1
    assert goals[0]["id"] == data["id"]


@pytest.mark.asyncio
async def test_update_and_complete_goal(client: AsyncClient):
    """Test updating goal parameters and completing goal."""
    cookies = await register_and_login(client, "update_goal@example.com")

    # Create Goal
    c_res = await client.post(
        "/api/v1/goals",
        json={
            "goal_type": "activity",
            "title": "Daily Workout Mins",
            "target_value": 30,
            "unit": "min",
        },
        cookies=cookies,
    )
    goal_id = c_res.json()["id"]

    # Patch Goal
    p_res = await client.patch(
        f"/api/v1/goals/{goal_id}",
        json={"target_value": 45, "title": "Increased Workout Mins"},
        cookies=cookies,
    )
    assert p_res.status_code == 200
    p_data = p_res.json()
    assert p_data["target_value"] == 45.0
    assert p_data["title"] == "Increased Workout Mins"

    # Complete Goal
    comp_res = await client.post(f"/api/v1/goals/{goal_id}/complete", cookies=cookies)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_archive_goal(client: AsyncClient):
    """Test archiving a health goal."""
    cookies = await register_and_login(client, "archive_goal@example.com")

    c_res = await client.post(
        "/api/v1/goals",
        json={"goal_type": "protein", "title": "Daily Protein RDA", "target_value": 60, "unit": "g"},
        cookies=cookies,
    )
    goal_id = c_res.json()["id"]

    del_res = await client.delete(f"/api/v1/goals/{goal_id}", cookies=cookies)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_goal_ownership_isolation(client: AsyncClient):
    """Verify User B cannot access, update, or archive User A's goal."""
    cookies_a = await register_and_login(client, "user_a_goal@example.com")
    cookies_b = await register_and_login(client, "user_b_goal@example.com")

    # User A creates goal
    c_res = await client.post(
        "/api/v1/goals",
        json={"goal_type": "hydration", "title": "User A Water Goal", "target_value": 2000, "unit": "ml"},
        cookies=cookies_a,
    )
    goal_a_id = c_res.json()["id"]

    # User B attempts get -> 404
    get_res = await client.get(f"/api/v1/goals/{goal_a_id}", cookies=cookies_b)
    assert get_res.status_code == 404

    # User B attempts update -> 404
    p_res = await client.patch(f"/api/v1/goals/{goal_a_id}", json={"target_value": 3000}, cookies=cookies_b)
    assert p_res.status_code == 404

    # User B attempts archive -> 404
    del_res = await client.delete(f"/api/v1/goals/{goal_a_id}", cookies=cookies_b)
    assert del_res.status_code == 404


@pytest.mark.asyncio
async def test_pediatric_safety_rejection_child(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify child profile attempting weight-loss or calorie-restriction goal is rejected with 400."""
    email = "child_safety@example.com"
    cookies = await register_and_login(client, email)
    await set_user_profile_type(db_session, email, "child", age=8)

    # Unsafe weight loss goal attempt
    res1 = await client.post(
        "/api/v1/goals",
        json={
            "goal_type": "weight_tracking",
            "title": "Aggressive Weight Loss Plan",
            "description": "Focus on calorie deficit for weight loss",
            "target_value": 30,
            "unit": "kg",
        },
        cookies=cookies,
    )
    assert res1.status_code == 400
    res_data = res1.json()
    msg = res_data["error"]["message"].lower() if "error" in res_data else str(res_data).lower()
    assert "pediatric profiles" in msg


@pytest.mark.asyncio
async def test_pediatric_safety_rejection_teen(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify teen profile attempting fat loss / dieting goal is rejected with 400."""
    email = "teen_safety@example.com"
    cookies = await register_and_login(client, email)
    await set_user_profile_type(db_session, email, "teen", age=14)

    res = await client.post(
        "/api/v1/goals",
        json={
            "goal_type": "nutrition",
            "title": "Fat loss cutting calories",
            "target_value": 1500,
            "unit": "kcal",
        },
        cookies=cookies,
    )
    assert res.status_code == 400
    res_data = res.json()
    msg = res_data["error"]["message"].lower() if "error" in res_data else str(res_data).lower()
    assert "pediatric profiles" in msg


@pytest.mark.asyncio
async def test_pediatric_allowed_goals(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify child profile creating healthy growth / hydration goal succeeds cleanly."""
    email = "child_good@example.com"
    cookies = await register_and_login(client, email)
    await set_user_profile_type(db_session, email, "child", age=9)

    res = await client.post(
        "/api/v1/goals",
        json={
            "goal_type": "hydration",
            "title": "Daily Water for Play & Growth",
            "description": "Stay hydrated for energy and focus",
            "target_value": 1600,
            "unit": "ml",
        },
        cookies=cookies,
    )
    assert res.status_code == 201
    assert res.json()["title"] == "Daily Water for Play & Growth"


@pytest.mark.asyncio
async def test_real_data_hydration_progress(
    client: AsyncClient, db_session: AsyncSession
):
    """Test real database water logs compute accurate progress percentage."""
    email = "hyd_progress@example.com"
    cookies = await register_and_login(client, email)
    user = await set_user_profile_type(db_session, email, "adult")

    # Create Goal
    g_res = await client.post(
        "/api/v1/goals",
        json={"goal_type": "hydration", "title": "Hydration Target", "target_value": 2000, "unit": "ml"},
        cookies=cookies,
    )
    goal_id = g_res.json()["id"]

    # Log 2000 mL water today
    now = datetime.now(timezone.utc)
    w_log = WaterLog(user_id=user.id, date=now, amount_ml=2000, note="bottle")
    db_session.add(w_log)
    await db_session.commit()

    # Get Progress
    prog_res = await client.get(f"/api/v1/goals/{goal_id}/progress", cookies=cookies)
    assert prog_res.status_code == 200
    p_data = prog_res.json()
    assert p_data["has_data"] is True
    assert p_data["current_value"] == 2000.0
    assert p_data["progress_percentage"] == 100.0


@pytest.mark.asyncio
async def test_real_data_activity_progress(
    client: AsyncClient, db_session: AsyncSession
):
    """Test real database activity logs compute active minutes progress."""
    email = "act_progress@example.com"
    cookies = await register_and_login(client, email)
    user = await set_user_profile_type(db_session, email, "adult")

    g_res = await client.post(
        "/api/v1/goals",
        json={"goal_type": "activity", "title": "Weekly Active Mins", "target_value": 150, "unit": "min"},
        cookies=cookies,
    )
    goal_id = g_res.json()["id"]

    # Log activity
    now = datetime.now(timezone.utc)
    a_log = ActivityLog(user_id=user.id, date=now, activity_type="Cycling", active_minutes=45, steps=3000)
    db_session.add(a_log)
    await db_session.commit()

    prog_res = await client.get(f"/api/v1/goals/{goal_id}/progress", cookies=cookies)
    assert prog_res.status_code == 200
    p_data = prog_res.json()
    assert p_data["has_data"] is True
    assert p_data["current_value"] == 45.0
    assert p_data["progress_percentage"] == 30.0


@pytest.mark.asyncio
async def test_insufficient_data_behavior(client: AsyncClient):
    """Verify fresh user goal returns explicit no_data state instead of fake 0%."""
    cookies = await register_and_login(client, "no_data_goal@example.com")

    g_res = await client.post(
        "/api/v1/goals",
        json={"goal_type": "hydration", "title": "Empty Water Goal", "target_value": 2500, "unit": "ml"},
        cookies=cookies,
    )
    goal_id = g_res.json()["id"]

    prog_res = await client.get(f"/api/v1/goals/{goal_id}/progress", cookies=cookies)
    assert prog_res.status_code == 200
    p_data = prog_res.json()
    assert p_data["has_data"] is False
    assert p_data["data_quality"] == "no_data"
    assert p_data["progress_percentage"] is None


@pytest.mark.asyncio
async def test_goals_dashboard(client: AsyncClient):
    """Test unified goals dashboard returns active goals, completion count, and coaching insights."""
    cookies = await register_and_login(client, "dash_goals@example.com")

    # Create goal 1 (active)
    await client.post(
        "/api/v1/goals",
        json={"goal_type": "hydration", "title": "Water Goal", "target_value": 2000, "unit": "ml"},
        cookies=cookies,
    )

    # Create goal 2 (completed)
    g2 = await client.post(
        "/api/v1/goals",
        json={"goal_type": "activity", "title": "Walk Goal", "target_value": 30, "unit": "min"},
        cookies=cookies,
    )
    g2_id = g2.json()["id"]
    await client.post(f"/api/v1/goals/{g2_id}/complete", cookies=cookies)

    # Get Dashboard
    dash_res = await client.get("/api/v1/goals/dashboard", cookies=cookies)
    assert dash_res.status_code == 200
    d_data = dash_res.json()
    assert len(d_data["active_goals"]) == 1
    assert d_data["completed_goals_count"] == 1
    assert len(d_data["coaching_insights"]) > 0
    assert "persona" in d_data


@pytest.mark.asyncio
async def test_older_adult_coaching(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify older adult profile receives sarcopenia prevention / protein guidance."""
    email = "older_coach@example.com"
    cookies = await register_and_login(client, email)
    await set_user_profile_type(db_session, email, "older_adult", age=68)

    insights_res = await client.get("/api/v1/goals/coaching/insights", cookies=cookies)
    assert insights_res.status_code == 200
    insights = insights_res.json()
    assert any("muscle strength" in i["title"].lower() or "sarcopenia" in i["message"].lower() for i in insights)

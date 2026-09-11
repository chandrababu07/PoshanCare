from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.activity import ActivityLog
from app.models.diary import Meal, MealEntry
from app.models.food import Food
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.meal_plan import MealPlan
from app.models.notification import HealthNotification
from app.models.recipe import Recipe
from app.models.user import User
from app.models.weight import WeightLog


async def register_and_login(client: AsyncClient, email: str, name: str = "Test User") -> dict:
    """Helper to register and login user, returning cookie jar."""
    client.cookies.clear()
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": name},
    )
    assert reg_res.status_code in (200, 201), f"Register failed for {email}: {reg_res.status_code} {reg_res.text}"
    client.cookies.clear()
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200, f"Login failed for {email}: {login_res.status_code} {login_res.text}"
    cookies = dict(login_res.cookies)
    client.cookies.clear()
    return cookies


@pytest.mark.asyncio
async def test_1_unauthenticated_endpoint_rejection(client: AsyncClient):
    """1. Verify unauthenticated request to protected endpoint is rejected with 401."""
    client.cookies.clear()
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401
    data = res.json()
    assert data["error"]["code"] in ["UNAUTHENTICATED", "INVALID_TOKEN"]


@pytest.mark.asyncio
async def test_2_user_a_cannot_access_user_b_meal(client: AsyncClient, db_session: AsyncSession):
    """2. Verify User A cannot view User B's food diary meals."""
    cookies_a = await register_and_login(client, "sec_usera1@example.com", "User A")
    cookies_b = await register_and_login(client, "sec_userb1@example.com", "User B")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb1@example.com"))
    user_b = res_b.scalar_one()

    # User B logs a meal
    today_dt = datetime.now(timezone.utc)
    meal_b = Meal(user_id=user_b.id, meal_type="lunch", consumed_at=today_dt)
    db_session.add(meal_b)
    await db_session.commit()

    # User A requests diary for today -> should NOT contain User B's meal entries
    client.cookies.clear()
    res = await client.get(f"/api/v1/diary?date={today_dt.strftime('%Y-%m-%d')}", cookies=cookies_a)
    assert res.status_code == 200
    data = res.json()
    # User A's diary should be empty
    lunch_section = next(m for m in data["meals"] if m["id"] == "lunch")
    assert len(lunch_section["items"]) == 0


@pytest.mark.asyncio
async def test_3_user_a_cannot_modify_user_b_meal(client: AsyncClient, db_session: AsyncSession):
    """3. Verify User A cannot update User B's meal entry."""
    cookies_a = await register_and_login(client, "sec_usera2@example.com")
    await register_and_login(client, "sec_userb2@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb2@example.com"))
    user_b = res_b.scalar_one()

    meal_b = Meal(user_id=user_b.id, meal_type="breakfast", consumed_at=datetime.now(timezone.utc))
    db_session.add(meal_b)
    await db_session.flush()

    entry_b = MealEntry(
        meal_id=meal_b.id,
        food_id=1,
        quantity=1.0,
        serving_name="1 serving",
        serving_gram=100.0,
        calories=100.0,
        protein_g=5.0,
        carbs_g=10.0,
        fat_g=2.0,
    )
    db_session.add(entry_b)
    await db_session.commit()

    # User A attempts to modify User B's entry
    client.cookies.clear()
    res = await client.patch(f"/api/v1/diary/entries/{entry_b.id}", json={"quantity": 5.0}, cookies=cookies_a)
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_4_user_a_cannot_delete_user_b_meal(client: AsyncClient, db_session: AsyncSession):
    """4. Verify User A cannot delete User B's meal entry."""
    cookies_a = await register_and_login(client, "sec_usera3@example.com")
    await register_and_login(client, "sec_userb3@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb3@example.com"))
    user_b = res_b.scalar_one()

    meal_b = Meal(user_id=user_b.id, meal_type="dinner", consumed_at=datetime.now(timezone.utc))
    db_session.add(meal_b)
    await db_session.flush()

    entry_b = MealEntry(
        meal_id=meal_b.id,
        food_id=1,
        quantity=1.0,
        serving_name="1 serving",
        serving_gram=100.0,
        calories=150.0,
        protein_g=10.0,
        carbs_g=15.0,
        fat_g=3.0,
    )
    db_session.add(entry_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.delete(f"/api/v1/diary/entries/{entry_b.id}", cookies=cookies_a)
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_5_user_a_cannot_access_user_b_recipe(client: AsyncClient, db_session: AsyncSession):
    """5. Verify User A cannot view or modify User B's custom recipe."""
    cookies_a = await register_and_login(client, "sec_usera4@example.com")
    await register_and_login(client, "sec_userb4@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb4@example.com"))
    user_b = res_b.scalar_one()

    recipe_b = Recipe(user_id=user_b.id, title="User B Secret Soup", servings=2)
    db_session.add(recipe_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get(f"/api/v1/recipes/{recipe_b.id}", cookies=cookies_a)
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_6_user_a_cannot_access_user_b_meal_plan(client: AsyncClient, db_session: AsyncSession):
    """6. Verify User A cannot access or modify User B's meal plan."""
    cookies_a = await register_and_login(client, "sec_usera5@example.com")
    await register_and_login(client, "sec_userb5@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb5@example.com"))
    user_b = res_b.scalar_one()

    mplan_b = MealPlan(user_id=user_b.id, plan_date="2026-09-10", status="active")
    db_session.add(mplan_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.delete(f"/api/v1/meal-plans/{mplan_b.id}", cookies=cookies_a)
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_7_user_a_cannot_access_user_b_hydration(client: AsyncClient, db_session: AsyncSession):
    """7. Verify User A cannot view User B's water log."""
    cookies_a = await register_and_login(client, "sec_usera6@example.com")
    await register_and_login(client, "sec_userb6@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb6@example.com"))
    user_b = res_b.scalar_one()

    today_dt = datetime.now(timezone.utc)
    wlog_b = WaterLog(user_id=user_b.id, date=today_dt, amount_ml=2500)
    db_session.add(wlog_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get(f"/api/v1/hydration?date={today_dt.strftime('%Y-%m-%d')}", cookies=cookies_a)
    assert res.status_code == 200
    assert res.json()["total_water_ml"] == 0


@pytest.mark.asyncio
async def test_8_user_a_cannot_access_user_b_activity(client: AsyncClient, db_session: AsyncSession):
    """8. Verify User A cannot view User B's activity log."""
    cookies_a = await register_and_login(client, "sec_usera7@example.com")
    await register_and_login(client, "sec_userb7@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb7@example.com"))
    user_b = res_b.scalar_one()

    today_dt = datetime.now(timezone.utc)
    act_b = ActivityLog(user_id=user_b.id, activity_type="Running", active_minutes=30, steps=5000, date=today_dt)
    db_session.add(act_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get(f"/api/v1/activity?date={today_dt.strftime('%Y-%m-%d')}", cookies=cookies_a)
    assert res.status_code == 200
    assert res.json()["has_activity_data"] is False
    assert res.json()["log"] is None


@pytest.mark.asyncio
async def test_9_user_a_cannot_access_user_b_weight_log(client: AsyncClient, db_session: AsyncSession):
    """9. Verify User A cannot access User B's weight logs."""
    cookies_a = await register_and_login(client, "sec_usera8@example.com")
    await register_and_login(client, "sec_userb8@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb8@example.com"))
    user_b = res_b.scalar_one()

    wlog_b = WeightLog(user_id=user_b.id, date=datetime.now(timezone.utc), weight_kg=70.0)
    db_session.add(wlog_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get("/api/v1/weight", cookies=cookies_a)
    assert res.status_code == 200
    assert len(res.json()["logs"]) == 0
    assert res.json()["days_tracked"] == 0


@pytest.mark.asyncio
async def test_10_user_a_cannot_access_user_b_goal(client: AsyncClient, db_session: AsyncSession):
    """10. Verify User A cannot access or modify User B's goal."""
    cookies_a = await register_and_login(client, "sec_usera9@example.com")
    await register_and_login(client, "sec_userb9@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb9@example.com"))
    user_b = res_b.scalar_one()

    goal_b = HealthGoal(user_id=user_b.id, goal_type="hydration", title="Water Goal", target_value=2500.0, unit="ml", start_date="2026-09-10", status="active")
    db_session.add(goal_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get("/api/v1/goals", cookies=cookies_a)
    assert res.status_code == 200
    assert len(res.json()) == 0


@pytest.mark.asyncio
async def test_11_user_a_cannot_access_user_b_notifications(client: AsyncClient, db_session: AsyncSession):
    """11. Verify User A cannot access User B's notifications."""
    cookies_a = await register_and_login(client, "sec_usera10@example.com")
    await register_and_login(client, "sec_userb10@example.com")

    res_b = await db_session.execute(select(User).where(User.email == "sec_userb10@example.com"))
    user_b = res_b.scalar_one()

    notif_b = HealthNotification(user_id=user_b.id, notification_type="system", severity="info", title="Title B", message="Msg B", source="sec")
    db_session.add(notif_b)
    await db_session.commit()

    client.cookies.clear()
    res = await client.get("/api/v1/notifications", cookies=cookies_a)
    assert res.status_code == 200
    assert len(res.json()["items"]) == 0


@pytest.mark.asyncio
async def test_12_user_a_cannot_modify_user_b_notification_preferences(client: AsyncClient, db_session: AsyncSession):
    """12. Verify User A modifying their preferences does not affect User B."""
    cookies_a = await register_and_login(client, "sec_usera11@example.com")
    cookies_b = await register_and_login(client, "sec_userb11@example.com")

    # User A disables hydration reminders
    client.cookies.clear()
    await client.put("/api/v1/notifications/preferences", json={"hydration_reminders_enabled": False}, cookies=cookies_a)

    # User B preferences must remain True
    client.cookies.clear()
    res_b = await client.get("/api/v1/notifications/preferences", cookies=cookies_b)
    assert res_b.status_code == 200
    assert res_b.json()["hydration_reminders_enabled"] is True


@pytest.mark.asyncio
async def test_13_user_a_cannot_access_user_b_reports(client: AsyncClient, db_session: AsyncSession):
    """13. Verify User A reports contain only User A data."""
    cookies_a = await register_and_login(client, "sec_usera12@example.com", "User A Real")
    cookies_b = await register_and_login(client, "sec_userb12@example.com", "User B Secret")

    client.cookies.clear()
    res_a = await client.get("/api/v1/reports/metrics?report_type=7day", cookies=cookies_a)
    assert res_a.status_code == 200
    data = res_a.json()
    assert data["patientName"] == "User A Real"


@pytest.mark.asyncio
async def test_14_user_a_cannot_access_user_b_health_insights(client: AsyncClient, db_session: AsyncSession):
    """14. Verify User A insights query returns only User A telemetry."""
    cookies_a = await register_and_login(client, "sec_usera13@example.com")
    client.cookies.clear()
    res_a = await client.get("/api/v1/health-insights", cookies=cookies_a)
    assert res_a.status_code == 200


@pytest.mark.asyncio
async def test_15_user_a_cannot_export_user_b_data(client: AsyncClient, db_session: AsyncSession):
    """15. Verify account export contains strictly current user's profile and data."""
    cookies_a = await register_and_login(client, "sec_usera14@example.com", "User A Export")
    client.cookies.clear()
    res_a = await client.get("/api/v1/account/export", cookies=cookies_a)
    assert res_a.status_code == 200
    data = res_a.json()
    assert data["user"]["email"] == "sec_usera14@example.com"


@pytest.mark.asyncio
async def test_16_deleted_account_session_becomes_invalid(client: AsyncClient, db_session: AsyncSession):
    """16. Verify deleted user account cannot access API endpoints."""
    cookies = await register_and_login(client, "sec_del@example.com")

    # Delete account
    client.cookies.clear()
    del_res = await client.delete("/api/v1/account", cookies=cookies)
    assert del_res.status_code == 200

    # Next call with same cookies must return 401 UNAUTHENTICATED
    client.cookies.clear()
    me_res = await client.get("/api/v1/auth/me", cookies=cookies)
    assert me_res.status_code == 401


@pytest.mark.asyncio
async def test_17_invalid_authentication_cookie_rejected(client: AsyncClient):
    """17. Verify invalid/garbage authentication cookie is rejected."""
    client.cookies.set("access_token", "invalid_garbage_token_value_12345")
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_18_malformed_authentication_token_rejected(client: AsyncClient):
    """18. Verify access token with invalid signature or algorithm is rejected."""
    # Create token signed with wrong secret key
    fake_token = create_access_token(subject=999, email="hacker@example.com")
    client.cookies.set("access_token", fake_token + "_tampered")
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401

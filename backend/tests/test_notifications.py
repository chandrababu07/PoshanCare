from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.notification import HealthNotification
from app.models.profile import UserProfile
from app.models.user import User
from app.models.weight import WeightLog


async def register_and_login(client: AsyncClient, email: str, name: str = "Notif User") -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": name},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
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


@pytest.mark.asyncio
async def test_unauthenticated_notification_access(client: AsyncClient):
    """Verify unauthenticated requests are rejected with HTTP 401."""
    res = await client.get("/api/v1/notifications")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_user_notifications(client: AsyncClient, db_session: AsyncSession):
    """Verify authenticated user can fetch empty notification list and unread count."""
    cookies = await register_and_login(client, "notif_user1@example.com")
    res = await client.get("/api/v1/notifications", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total_count" in data
    assert "unread_count" in data
    assert data["total_count"] == 0
    assert data["unread_count"] == 0


@pytest.mark.asyncio
async def test_user_notification_isolation(client: AsyncClient, db_session: AsyncSession):
    """Verify strict current-user data isolation for notifications."""
    cookies_a = await register_and_login(client, "notif_user_a@example.com", "User A")
    cookies_b = await register_and_login(client, "notif_user_b@example.com", "User B")

    # Get User A ID
    res_a = await db_session.execute(select(User).where(User.email == "notif_user_a@example.com"))
    user_a = res_a.scalar_one()

    # Create notification for User A
    notif_a = HealthNotification(
        user_id=user_a.id,
        notification_type="hydration",
        severity="medium",
        title="User A Hydration Alert",
        message="User A should drink water.",
        source="hydration_test_a",
        is_read=False,
    )
    db_session.add(notif_a)
    await db_session.commit()

    # User B lists notifications -> should NOT see User A's notification
    res_b = await client.get("/api/v1/notifications", cookies=cookies_b)
    assert res_b.status_code == 200
    assert res_b.json()["total_count"] == 0

    # User B attempts to mark User A's notification read -> should fail with 404
    mark_res = await client.post(f"/api/v1/notifications/{notif_a.id}/read", cookies=cookies_b)
    assert mark_res.status_code == 404


@pytest.mark.asyncio
async def test_mark_single_and_all_read(client: AsyncClient, db_session: AsyncSession):
    """Verify marking single and all notifications as read."""
    cookies = await register_and_login(client, "notif_read@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_read@example.com"))
    user = res_user.scalar_one()

    n1 = HealthNotification(
        user_id=user.id,
        notification_type="hydration",
        severity="medium",
        title="Hydration Check 1",
        message="Drink water 1",
        source="rule_1",
    )
    n2 = HealthNotification(
        user_id=user.id,
        notification_type="activity",
        severity="low",
        title="Activity Prompt 2",
        message="Move around 2",
        source="rule_2",
    )
    db_session.add_all([n1, n2])
    await db_session.commit()

    # Check unread count = 2
    count_res = await client.get("/api/v1/notifications/unread-count", cookies=cookies)
    assert count_res.status_code == 200
    assert count_res.json()["count"] == 2

    # Mark n1 read
    read_res = await client.post(f"/api/v1/notifications/{n1.id}/read", cookies=cookies)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # Unread count should now be 1
    count_res2 = await client.get("/api/v1/notifications/unread-count", cookies=cookies)
    assert count_res2.json()["count"] == 1

    # Mark all read
    read_all_res = await client.post("/api/v1/notifications/read-all", cookies=cookies)
    assert read_all_res.status_code == 200
    assert read_all_res.json()["count"] == 1

    # Final unread count = 0
    count_res3 = await client.get("/api/v1/notifications/unread-count", cookies=cookies)
    assert count_res3.json()["count"] == 0


@pytest.mark.asyncio
async def test_generate_hydration_notification(client: AsyncClient, db_session: AsyncSession):
    """Verify rule-based generation of hydration notification on telemetry gap."""
    cookies = await register_and_login(client, "notif_hyd@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_hyd@example.com"))
    user = res_user.scalar_one()

    today_dt = datetime.now(timezone.utc)
    wlog = WaterLog(user_id=user.id, date=today_dt, amount_ml=500)
    db_session.add(wlog)
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert data["generated_count"] >= 1
    assert any(n["notification_type"] == "hydration" for n in data["notifications"])


@pytest.mark.asyncio
async def test_generate_activity_notification(client: AsyncClient, db_session: AsyncSession):
    """Verify activity telemetry gap generates activity prompt."""
    cookies = await register_and_login(client, "notif_act@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_act@example.com"))
    user = res_user.scalar_one()

    today_date = datetime.now(timezone.utc)
    act_log = ActivityLog(user_id=user.id, date=today_date, active_minutes=5, steps=1000)
    db_session.add(act_log)
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert any(n["notification_type"] == "activity" for n in data["notifications"])


@pytest.mark.asyncio
async def test_generate_goal_milestone_notification(client: AsyncClient, db_session: AsyncSession):
    """Verify goal progress milestone triggers goal notification."""
    cookies = await register_and_login(client, "notif_goal@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_goal@example.com"))
    user = res_user.scalar_one()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_dt = datetime.now(timezone.utc)
    goal = HealthGoal(
        user_id=user.id,
        goal_type="hydration",
        title="Drink 3000ml Water",
        target_value=3000,
        unit="ml",
        start_date=today_str,
        status="active",
    )
    wlog = WaterLog(user_id=user.id, date=today_dt, amount_ml=3000)
    db_session.add_all([goal, wlog])
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert any(n["notification_type"] == "goal" for n in data["notifications"])


@pytest.mark.asyncio
async def test_duplicate_prevention(client: AsyncClient, db_session: AsyncSession):
    """Verify deterministic deduplication prevents identical notification spam in 24-hour window."""
    cookies = await register_and_login(client, "notif_dedup@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_dedup@example.com"))
    user = res_user.scalar_one()

    today_dt = datetime.now(timezone.utc)
    wlog = WaterLog(user_id=user.id, date=today_dt, amount_ml=400)
    db_session.add(wlog)
    await db_session.commit()

    # First generation
    gen1 = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen1.status_code == 200
    count1 = gen1.json()["generated_count"]
    assert count1 >= 1

    # Second immediate generation -> should produce 0 duplicates
    gen2 = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen2.status_code == 200
    count2 = gen2.json()["generated_count"]
    assert count2 == 0


@pytest.mark.asyncio
async def test_child_persona_safety(client: AsyncClient, db_session: AsyncSession):
    """Verify child persona strictly blocks weight-loss and calorie restriction language."""
    cookies = await register_and_login(client, "notif_child@example.com", "Child User")
    await set_user_profile_type(db_session, "notif_child@example.com", "child", age=10)

    res_user = await db_session.execute(select(User).where(User.email == "notif_child@example.com"))
    user = res_user.scalar_one()

    today_date = datetime.now(timezone.utc)
    wlog1 = WeightLog(user_id=user.id, date=today_date, weight_kg=35.0)
    wlog2 = WeightLog(user_id=user.id, date=today_date - timedelta(days=2), weight_kg=37.0)
    db_session.add_all([wlog1, wlog2])
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200

    # Fetch notifications
    list_res = await client.get("/api/v1/notifications", cookies=cookies)
    notifs = list_res.json()["items"]

    # Verify no weight-loss or calorie-restriction terms exist in any notification title/message
    forbidden = ["weight loss", "calorie deficit", "fat loss", "dieting", "restrict"]
    for notif in notifs:
        full_text = f"{notif['title']} {notif['message']}".lower()
        for term in forbidden:
            assert term not in full_text, f"Forbidden term '{term}' found in child notification text!"


@pytest.mark.asyncio
async def test_deterministic_severity_ordering(client: AsyncClient, db_session: AsyncSession):
    """Verify notifications are deterministically ordered by severity (high > medium > low > info)."""
    cookies = await register_and_login(client, "notif_order@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_order@example.com"))
    user = res_user.scalar_one()

    n_info = HealthNotification(
        user_id=user.id, notification_type="system", severity="info", title="Info", message="msg", source="s1"
    )
    n_high = HealthNotification(
        user_id=user.id, notification_type="goal", severity="high", title="High", message="msg", source="s2"
    )
    n_med = HealthNotification(
        user_id=user.id, notification_type="hydration", severity="medium", title="Medium", message="msg", source="s3"
    )
    db_session.add_all([n_info, n_high, n_med])
    await db_session.commit()

    res = await client.get("/api/v1/notifications", cookies=cookies)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 3
    severities = [item["severity"] for item in items]
    assert severities[0] == "high"
    assert severities[1] == "medium"
    assert severities[2] == "info"


@pytest.mark.asyncio
async def test_teen_persona_safety(client: AsyncClient, db_session: AsyncSession):
    """Verify teen persona blocks restrictive eating and weight-loss language."""
    cookies = await register_and_login(client, "notif_teen@example.com", "Teen User")
    await set_user_profile_type(db_session, "notif_teen@example.com", "teen", age=16)

    res_user = await db_session.execute(select(User).where(User.email == "notif_teen@example.com"))
    user = res_user.scalar_one()

    today_date = datetime.now(timezone.utc)
    wlog1 = WeightLog(user_id=user.id, date=today_date, weight_kg=52.0)
    wlog2 = WeightLog(user_id=user.id, date=today_date - timedelta(days=2), weight_kg=54.0)
    db_session.add_all([wlog1, wlog2])
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200

    list_res = await client.get("/api/v1/notifications", cookies=cookies)
    notifs = list_res.json()["items"]

    forbidden = ["weight loss", "calorie deficit", "fat loss", "dieting", "restrict"]
    for notif in notifs:
        full_text = f"{notif['title']} {notif['message']}".lower()
        for term in forbidden:
            assert term not in full_text


@pytest.mark.asyncio
async def test_older_adult_messaging(client: AsyncClient, db_session: AsyncSession):
    """Verify older_adult profile generates clear, readable hydration and activity reminders."""
    cookies = await register_and_login(client, "notif_elder@example.com", "Senior User")
    await set_user_profile_type(db_session, "notif_elder@example.com", "older_adult", age=70)

    res_user = await db_session.execute(select(User).where(User.email == "notif_elder@example.com"))
    user = res_user.scalar_one()

    today_dt = datetime.now(timezone.utc)
    wlog = WaterLog(user_id=user.id, date=today_dt, amount_ml=600)
    db_session.add(wlog)
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert data["generated_count"] >= 1


@pytest.mark.asyncio
async def test_empty_telemetry_no_fabricated_alerts(client: AsyncClient, db_session: AsyncSession):
    """Verify empty telemetry does not fabricate random health alerts."""
    cookies = await register_and_login(client, "notif_empty@example.com")
    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200

    list_res = await client.get("/api/v1/notifications", cookies=cookies)
    notifs = list_res.json()["items"]
    # Only logging gap prompt or 0 alerts (no fake metrics)
    for n in notifs:
        assert n["notification_type"] in ["consistency", "system"]


@pytest.mark.asyncio
async def test_unlogged_meal_plan_notification(client: AsyncClient, db_session: AsyncSession):
    """Verify active meal plan with unlogged meals triggers meal plan notification."""
    cookies = await register_and_login(client, "notif_mp@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_mp@example.com"))
    user = res_user.scalar_one()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    mplan = MealPlan(user_id=user.id, plan_date=today_str, status="active")
    db_session.add(mplan)
    await db_session.commit()

    item = MealPlanItem(meal_plan_id=mplan.id, meal_type="lunch", food_id=1, servings=1.0)
    db_session.add(item)
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert any(n["notification_type"] == "meal_plan" for n in data["notifications"])


@pytest.mark.asyncio
async def test_notification_type_and_unread_filtering(client: AsyncClient, db_session: AsyncSession):
    """Verify querying with notification_type and unread_only parameters."""
    cookies = await register_and_login(client, "notif_filter@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_filter@example.com"))
    user = res_user.scalar_one()

    n1 = HealthNotification(user_id=user.id, notification_type="hydration", severity="info", title="Hydration 1", message="m1", source="f1", is_read=True)
    n2 = HealthNotification(user_id=user.id, notification_type="hydration", severity="medium", title="Hydration 2", message="m2", source="f2", is_read=False)
    n3 = HealthNotification(user_id=user.id, notification_type="activity", severity="low", title="Activity 1", message="m3", source="f3", is_read=False)
    db_session.add_all([n1, n2, n3])
    await db_session.commit()

    # Filter unread hydration only
    res = await client.get("/api/v1/notifications?unread_only=true&notification_type=hydration", cookies=cookies)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Hydration 2"


@pytest.mark.asyncio
async def test_notification_limit_parameter(client: AsyncClient, db_session: AsyncSession):
    """Verify notification query limit parameter."""
    cookies = await register_and_login(client, "notif_limit@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "notif_limit@example.com"))
    user = res_user.scalar_one()

    for i in range(10):
        db_session.add(HealthNotification(user_id=user.id, notification_type="system", severity="info", title=f"Notif {i}", message="m", source=f"lim_{i}"))
    await db_session.commit()

    res = await client.get("/api/v1/notifications?limit=3", cookies=cookies)
    assert res.status_code == 200
    assert len(res.json()["items"]) == 3


@pytest.mark.asyncio
async def test_notification_preferences_crud_and_isolation(client: AsyncClient, db_session: AsyncSession):
    """Verify notification preference GET/PUT operations and user isolation."""
    cookies_a = await register_and_login(client, "pref_a@example.com", "User Pref A")
    cookies_b = await register_and_login(client, "pref_b@example.com", "User Pref B")

    # Get default preferences for User A
    res_a = await client.get("/api/v1/notifications/preferences", cookies=cookies_a)
    assert res_a.status_code == 200
    prefs_a = res_a.json()
    assert prefs_a["meal_reminders_enabled"] is True

    # Disable hydration reminders for User A
    update_res = await client.put(
        "/api/v1/notifications/preferences",
        json={"hydration_reminders_enabled": False},
        cookies=cookies_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["hydration_reminders_enabled"] is False

    # Verify User B preferences remain default (True) -> User isolation
    res_b = await client.get("/api/v1/notifications/preferences", cookies=cookies_b)
    assert res_b.status_code == 200
    assert res_b.json()["hydration_reminders_enabled"] is True


@pytest.mark.asyncio
async def test_disabled_reminder_preferences_respected(client: AsyncClient, db_session: AsyncSession):
    """Verify disabled notification preference categories prevent notification generation."""
    cookies = await register_and_login(client, "disabled_pref@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "disabled_pref@example.com"))
    user = res_user.scalar_one()

    # Disable hydration reminders
    await client.put(
        "/api/v1/notifications/preferences",
        json={"hydration_reminders_enabled": False},
        cookies=cookies,
    )

    # Log partial hydration (which would normally trigger hydration reminder)
    wlog = WaterLog(user_id=user.id, date=datetime.now(timezone.utc), amount_ml=500)
    db_session.add(wlog)
    await db_session.commit()

    # Generate notifications
    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200
    notifs = gen_res.json()["notifications"]

    # Verify 0 hydration notifications are generated
    assert not any(n["notification_type"] == "hydration" for n in notifs)


@pytest.mark.asyncio
async def test_weekly_summary_generation_real_telemetry(client: AsyncClient, db_session: AsyncSession):
    """Verify weekly summary notification uses real 7-day telemetry."""
    cookies = await register_and_login(client, "weekly_sum@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "weekly_sum@example.com"))
    user = res_user.scalar_one()

    # Log water for today
    wlog = WaterLog(user_id=user.id, date=datetime.now(timezone.utc), amount_ml=2000)
    db_session.add(wlog)
    await db_session.commit()

    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200

    list_res = await client.get("/api/v1/notifications?notification_type=weekly_summary", cookies=cookies)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1
    summary_item = items[0]
    assert "Weekly Health Summary" in summary_item["title"]
    assert "hydration on 1/7 days" in summary_item["message"]


@pytest.mark.asyncio
async def test_no_secrets_in_notifications(client: AsyncClient, db_session: AsyncSession):
    """Verify notification payloads contain no passwords, hashes, tokens, or security secrets."""
    cookies = await register_and_login(client, "sec_notif@example.com")
    gen_res = await client.post("/api/v1/notifications/generate", cookies=cookies)
    assert gen_res.status_code == 200

    raw_text = gen_res.text.lower()
    assert "password" not in raw_text
    assert "password123!" not in raw_text
    assert "secret" not in raw_text
    assert "jwt" not in raw_text



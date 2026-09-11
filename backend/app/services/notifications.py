from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.diary import Meal
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.meal_plan import MealPlan
from app.models.notification import HealthNotification, NotificationPreference
from app.models.profile import UserProfile
from app.models.weight import WeightLog
from app.services.goals import calculate_goal_progress


SEVERITY_ORDER = {
    "high": 1,
    "medium": 2,
    "low": 3,
    "info": 4,
}


def filter_persona_text(text: str, profile_type: str) -> str:
    """Filter notification text to enforce strict pediatric growth safety rules."""
    if profile_type in ["child", "teen"]:
        forbidden_phrases = [
            "calorie deficit",
            "weight loss",
            "fat loss",
            "dieting",
            "restrict calories",
            "lose weight",
            "body weight",
            "overweight",
            "underweight",
        ]
        lowered = text.lower()
        for phrase in forbidden_phrases:
            if phrase in lowered:
                return (
                    "Focus on nourishing meals, healthy energy, hydration, and active play for growth!"
                )
    return text


async def get_user_notification_preferences(
    db: AsyncSession, user_id: int
) -> NotificationPreference:
    """Fetch existing notification preferences for user or create default settings if not existing."""
    stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()

    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return prefs


async def update_user_notification_preferences(
    db: AsyncSession, user_id: int, update_data: Dict[str, Any]
) -> NotificationPreference:
    """Update notification preferences for current user."""
    prefs = await get_user_notification_preferences(db, user_id)

    valid_fields = {
        "meal_reminders_enabled",
        "meal_reminder_time",
        "hydration_reminders_enabled",
        "hydration_reminder_frequency_hours",
        "activity_reminders_enabled",
        "weight_reminders_enabled",
        "goal_updates_enabled",
        "weekly_summary_enabled",
        "insights_enabled",
    }

    for key, value in update_data.items():
        if value is not None and key in valid_fields:
            setattr(prefs, key, value)

    await db.commit()
    await db.refresh(prefs)
    return prefs


async def is_duplicate_notification(
    db: AsyncSession, user_id: int, notification_type: str, source: str, window_hours: int = 24
) -> bool:
    """Check if a notification with the same source was already generated for the user in the window."""
    since_time = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    stmt = (
        select(HealthNotification.id)
        .where(
            HealthNotification.user_id == user_id,
            HealthNotification.notification_type == notification_type,
            HealthNotification.source == source,
            HealthNotification.created_at >= since_time,
        )
        .limit(1)
    )
    res = (await db.execute(stmt)).scalar_one_or_none()
    return res is not None


async def create_notification_if_unique(
    db: AsyncSession,
    user_id: int,
    notification_type: str,
    severity: str,
    title: str,
    message: str,
    action: Optional[str],
    source: str,
    profile_type: str = "adult",
    metadata_json: Optional[Dict[str, Any]] = None,
    window_hours: int = 24,
) -> Optional[HealthNotification]:
    """Create and persist a notification if not duplicated within the window."""
    if await is_duplicate_notification(db, user_id, notification_type, source, window_hours):
        return None

    safe_title = filter_persona_text(title, profile_type)
    safe_message = filter_persona_text(message, profile_type)

    notif = HealthNotification(
        user_id=user_id,
        notification_type=notification_type,
        severity=severity,
        title=safe_title,
        message=safe_message,
        action=action,
        source=source,
        is_read=False,
        created_at=datetime.now(timezone.utc),
        metadata_json=metadata_json,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def generate_user_notifications(db: AsyncSession, user_id: int) -> List[HealthNotification]:
    """
    Evaluates real DB telemetry for the given user and generates new explainable health notifications.
    Deduplicates based on 24-hour window per rule source (or 168h for weekly summaries).
    Respects user notification preferences and persona safety rules.
    """
    created_notifications: List[HealthNotification] = []

    # 0. Fetch preferences & profile
    prefs = await get_user_notification_preferences(db, user_id)
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    profile_type = profile.profile_type if profile else "adult"

    now_utc = datetime.now(timezone.utc)
    today_str = now_utc.strftime("%Y-%m-%d")

    # 1. HYDRATION RULES
    if prefs.hydration_reminders_enabled:
        water_sum_res = await db.execute(
            select(func.sum(WaterLog.amount_ml)).where(
                WaterLog.user_id == user_id, func.date(WaterLog.date) == today_str
            )
        )
        total_water = water_sum_res.scalar() or 0
        target_water = 2500

        if total_water >= target_water:
            notif = await create_notification_if_unique(
                db,
                user_id=user_id,
                notification_type="hydration",
                severity="info",
                title="Hydration Goal Met! 💧",
                message=f"Awesome job! You reached your daily hydration target of {target_water} ml ({total_water} ml logged).",
                action="log_water",
                source=f"hydration_target_met_{today_str}",
                profile_type=profile_type,
            )
            if notif:
                created_notifications.append(notif)
        elif 0 < total_water < 0.5 * target_water:
            notif = await create_notification_if_unique(
                db,
                user_id=user_id,
                notification_type="hydration",
                severity="medium",
                title="Hydration Check Reminder 💧",
                message=f"You've logged {total_water} ml of water so far today. Your target is {target_water} ml.",
                action="log_water",
                source=f"hydration_gap_{today_str}",
                profile_type=profile_type,
            )
            if notif:
                created_notifications.append(notif)

    # 2. NUTRITION & CONSISTENCY RULES
    if prefs.meal_reminders_enabled:
        today_meals_res = await db.execute(
            select(Meal).where(Meal.user_id == user_id, func.date(Meal.consumed_at) == today_str)
        )
        today_meals = today_meals_res.scalars().all()

        if not today_meals:
            notif = await create_notification_if_unique(
                db,
                user_id=user_id,
                notification_type="consistency",
                severity="low",
                title="Food Diary Reminder 🥗",
                message="No meals recorded yet today. Log your breakfast, lunch, or snack to keep your nutrition history accurate.",
                action="log_food",
                source=f"logging_gap_{today_str}",
                profile_type=profile_type,
            )
            if notif:
                created_notifications.append(notif)
        else:
            distinct_days_res = await db.execute(
                select(func.date(Meal.consumed_at))
                .where(Meal.user_id == user_id)
                .group_by(func.date(Meal.consumed_at))
                .order_by(desc(func.date(Meal.consumed_at)))
                .limit(3)
            )
            distinct_days = distinct_days_res.scalars().all()

            if len(distinct_days) >= 3:
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="consistency",
                    severity="info",
                    title="3-Day Logging Streak! 🎉",
                    message="Great consistency! You've logged your meals for 3 consecutive days.",
                    action="log_food",
                    source=f"logging_streak_3d_{today_str}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)

    # 3. ACTIVITY RULES
    if prefs.activity_reminders_enabled:
        today_act_res = await db.execute(
            select(ActivityLog).where(ActivityLog.user_id == user_id, func.date(ActivityLog.date) == today_str)
        )
        today_activity = today_act_res.scalar_one_or_none()

        if today_activity:
            active_mins = today_activity.active_minutes or 0
            steps = today_activity.steps or 0
            if active_mins < 15 and steps < 3000:
                msg = (
                    "You have logged active play and light movement today!"
                    if profile_type in ["child", "teen"]
                    else f"You've logged {active_mins} active minutes and {steps} steps today. A short walk can help boost energy."
                )
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="activity",
                    severity="low",
                    title="Movement & Activity Prompt 🚶‍♂️",
                    message=msg,
                    action="track_activity",
                    source=f"activity_gap_{today_str}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)

    # 4. GOAL PROGRESS RULES
    if prefs.goal_updates_enabled:
        active_goals_res = await db.execute(
            select(HealthGoal).where(HealthGoal.user_id == user_id, HealthGoal.status == "active")
        )
        active_goals = active_goals_res.scalars().all()

        for goal in active_goals:
            progress = await calculate_goal_progress(db, user_id, goal)
            pct = progress.progress_percentage or 0

            if pct >= 100:
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="goal",
                    severity="high",
                    title=f"Goal Accomplished: {goal.title}! 🏆",
                    message=f"Congratulations! You reached 100% of your target ({goal.target_value} {goal.unit}).",
                    action="view_goals",
                    source=f"goal_completed_{goal.id}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)
            elif pct >= 50:
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="goal",
                    severity="info",
                    title=f"Halfway to Goal: {goal.title}! 🎯",
                    message=f"You're at {round(pct)}% of your target ({progress.current_value or 0}/{goal.target_value} {goal.unit}). Keep going!",
                    action="view_goals",
                    source=f"goal_milestone_50_{goal.id}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)

    # 5. MEAL PLAN UNLOGGED MEAL RULES
    if prefs.meal_reminders_enabled:
        today_plan_res = await db.execute(
            select(MealPlan).where(MealPlan.user_id == user_id, MealPlan.plan_date == today_str)
        )
        today_plan = today_plan_res.scalar_one_or_none()

        if today_plan and today_plan.items:
            planned_types = {item.meal_type for item in today_plan.items}
            today_meals_res = await db.execute(
                select(Meal).where(Meal.user_id == user_id, func.date(Meal.consumed_at) == today_str)
            )
            logged_types = {m.meal_type for m in today_meals_res.scalars().all()}
            unlogged_types = planned_types - logged_types

            if unlogged_types:
                next_meal = list(unlogged_types)[0].capitalize()
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="meal_plan",
                    severity="info",
                    title=f"Planned {next_meal} Ready 🍽️",
                    message=f"Your meal plan includes items for {next_meal} today that haven't been logged in your diary yet.",
                    action="open_meal_plan",
                    source=f"unlogged_meal_plan_{next_meal.lower()}_{today_str}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)

    # 6. WEIGHT TREND RULE (Adults only & enabled)
    if prefs.weight_reminders_enabled and profile_type not in ["child", "teen"]:
        recent_weights_res = await db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == user_id)
            .order_by(desc(WeightLog.date))
            .limit(2)
        )
        recent_weights = recent_weights_res.scalars().all()

        if len(recent_weights) >= 2:
            latest = recent_weights[0].weight_kg
            prev = recent_weights[1].weight_kg
            diff = round(latest - prev, 1)
            if abs(diff) >= 0.5:
                direction = "increased" if diff > 0 else "decreased"
                notif = await create_notification_if_unique(
                    db,
                    user_id=user_id,
                    notification_type="weight",
                    severity="info",
                    title="Weight Log Entry Update ⚖️",
                    message=f"Your recorded weight has {direction} by {abs(diff)} kg ({latest} kg recorded on {recent_weights[0].date}).",
                    action="log_weight",
                    source=f"weight_update_{recent_weights[0].date}",
                    profile_type=profile_type,
                )
                if notif:
                    created_notifications.append(notif)

    # 7. WEEKLY SUMMARY RULE (Real 7-day telemetry)
    if prefs.weekly_summary_enabled:
        seven_days_ago = now_utc - timedelta(days=7)
        week_identifier = now_utc.strftime("%Y-W%U")

        meal_days_count = (
            await db.scalar(
                select(func.count(func.distinct(func.date(Meal.consumed_at)))).where(
                    Meal.user_id == user_id, Meal.consumed_at >= seven_days_ago
                )
            )
        ) or 0

        water_days_count = (
            await db.scalar(
                select(func.count(func.distinct(func.date(WaterLog.date)))).where(
                    WaterLog.user_id == user_id, WaterLog.date >= seven_days_ago
                )
            )
        ) or 0

        activity_days_count = (
            await db.scalar(
                select(func.count(func.distinct(func.date(ActivityLog.date)))).where(
                    ActivityLog.user_id == user_id, ActivityLog.date >= seven_days_ago
                )
            )
        ) or 0

        total_tracked_days = max(meal_days_count, water_days_count, activity_days_count)

        if total_tracked_days > 0:
            summary_msg = (
                f"Weekly Summary: You tracked food on {meal_days_count}/7 days, hydration on {water_days_count}/7 days, "
                f"and active telemetry on {activity_days_count}/7 days. Great job staying active!"
            )
            notif = await create_notification_if_unique(
                db,
                user_id=user_id,
                notification_type="weekly_summary",
                severity="info",
                title="Your Weekly Health Summary 📊",
                message=summary_msg,
                action="view_reports",
                source=f"weekly_summary_{week_identifier}",
                profile_type=profile_type,
                window_hours=168,
            )
            if notif:
                created_notifications.append(notif)

    return created_notifications


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = 50,
) -> List[HealthNotification]:
    """
    Fetch notifications for a specific user with optional filters.
    Orders deterministically by severity (high > medium > low > info) and then created_at DESC.
    """
    severity_case = case(
        (HealthNotification.severity == "high", 1),
        (HealthNotification.severity == "medium", 2),
        (HealthNotification.severity == "low", 3),
        else_=4,
    )

    query = select(HealthNotification).where(HealthNotification.user_id == user_id)

    if unread_only:
        query = query.where(HealthNotification.is_read == False)

    if notification_type and notification_type.lower() != "all":
        query = query.where(HealthNotification.notification_type == notification_type.lower())

    query = query.order_by(severity_case, desc(HealthNotification.created_at)).limit(limit)

    res = await db.execute(query)
    return list(res.scalars().all())


async def get_unread_count(db: AsyncSession, user_id: int) -> int:
    """Return count of unread notifications for a specific user."""
    stmt = (
        select(func.count())
        .select_from(HealthNotification)
        .where(HealthNotification.user_id == user_id, HealthNotification.is_read == False)
    )
    res = await db.execute(stmt)
    return res.scalar() or 0


async def mark_as_read(
    db: AsyncSession, user_id: int, notification_id: int
) -> Optional[HealthNotification]:
    """Mark a single notification as read if it belongs to the user."""
    res = await db.execute(
        select(HealthNotification).where(
            HealthNotification.id == notification_id,
            HealthNotification.user_id == user_id,
        )
    )
    notif = res.scalar_one_or_none()

    if notif:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(notif)
        return notif
    return None


async def mark_all_as_read(db: AsyncSession, user_id: int) -> int:
    """Mark all unread notifications as read for a specific user."""
    res = await db.execute(
        select(HealthNotification).where(
            HealthNotification.user_id == user_id,
            HealthNotification.is_read == False,
        )
    )
    unread_items = res.scalars().all()

    now = datetime.now(timezone.utc)
    count = len(unread_items)
    for item in unread_items:
        item.is_read = True
        item.read_at = now

    if count > 0:
        await db.commit()

    return count

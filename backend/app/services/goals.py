from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import HealthGoal
from app.models.profile import UserProfile
from app.models.hydration import WaterLog
from app.models.activity import ActivityLog
from app.models.diary import Meal, MealEntry
from app.models.weight import WeightLog
from app.schemas.goal import (
    GoalCreateRequest,
    GoalUpdateRequest,
    GoalResponse,
    GoalProgressResponse,
    GoalDashboardResponse,
)


PEDIATRIC_RESTRICTED_TERMS = [
    "weight loss",
    "fat loss",
    "calorie deficit",
    "cutting calories",
    "dieting",
    "slim",
    "skinny",
    "restrict",
    "starve",
    "body fat",
]


def validate_persona_goal_safety(
    profile_type: Optional[str],
    goal_type: str,
    title: str,
    description: Optional[str] = None,
) -> None:
    """Enforces strict pediatric growth safety validation for child and teen profiles."""
    if not profile_type or profile_type not in ["child", "teen"]:
        return

    text_to_check = f"{title} {description or ''}".lower()
    for term in PEDIATRIC_RESTRICTED_TERMS:
        if term in text_to_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Weight-loss and calorie-restriction goals are disabled for pediatric profiles "
                    "(child/teen) to support healthy growth and development."
                ),
            )


async def create_health_goal(
    db: AsyncSession, user_id: int, request: GoalCreateRequest
) -> HealthGoal:
    """Creates a new personal health goal with persona safety validation."""
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    profile_type = profile.profile_type if profile else "adult"

    validate_persona_goal_safety(
        profile_type=profile_type,
        goal_type=request.goal_type,
        title=request.title,
        description=request.description,
    )

    now = datetime.now(timezone.utc)
    start_date_str = request.start_date or now.strftime("%Y-%m-%d")

    goal = HealthGoal(
        user_id=user_id,
        goal_type=request.goal_type.lower().strip(),
        title=request.title.strip(),
        description=request.description.strip() if request.description else None,
        target_value=float(request.target_value),
        unit=request.unit.strip(),
        frequency=request.frequency.lower().strip(),
        start_date=start_date_str,
        target_date=request.target_date,
        status="active",
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


async def get_user_health_goals(
    db: AsyncSession, user_id: int, status_filter: Optional[str] = None
) -> List[HealthGoal]:
    """Retrieves all health goals belonging to current user."""
    stmt = select(HealthGoal).where(HealthGoal.user_id == user_id)
    if status_filter:
        stmt = stmt.where(HealthGoal.status == status_filter.lower().strip())
    stmt = stmt.order_by(HealthGoal.created_at.desc())

    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_health_goal_by_id(
    db: AsyncSession, user_id: int, goal_id: int
) -> Optional[HealthGoal]:
    """Retrieves a single health goal with strict current-user isolation."""
    stmt = select(HealthGoal).where(
        HealthGoal.id == goal_id, HealthGoal.user_id == user_id
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def update_health_goal(
    db: AsyncSession, user_id: int, goal_id: int, request: GoalUpdateRequest
) -> HealthGoal:
    """Updates an existing health goal."""
    goal = await get_health_goal_by_id(db, user_id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    profile_type = profile.profile_type if profile else "adult"

    new_title = request.title if request.title is not None else goal.title
    new_desc = request.description if request.description is not None else goal.description

    validate_persona_goal_safety(
        profile_type=profile_type,
        goal_type=goal.goal_type,
        title=new_title,
        description=new_desc,
    )

    if request.title is not None:
        goal.title = request.title.strip()
    if request.description is not None:
        goal.description = request.description.strip() if request.description else None
    if request.target_value is not None:
        goal.target_value = float(request.target_value)
    if request.unit is not None:
        goal.unit = request.unit.strip()
    if request.frequency is not None:
        goal.frequency = request.frequency.lower().strip()
    if request.target_date is not None:
        goal.target_date = request.target_date
    if request.status is not None:
        goal.status = request.status.lower().strip()

    goal.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(goal)
    return goal


async def complete_health_goal(
    db: AsyncSession, user_id: int, goal_id: int
) -> HealthGoal:
    """Marks a goal as completed."""
    goal = await get_health_goal_by_id(db, user_id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    goal.status = "completed"
    goal.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(goal)
    return goal


async def archive_health_goal(
    db: AsyncSession, user_id: int, goal_id: int
) -> HealthGoal:
    """Archives a health goal."""
    goal = await get_health_goal_by_id(db, user_id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    goal.status = "archived"
    goal.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(goal)
    return goal


async def calculate_goal_progress(
    db: AsyncSession, user_id: int, goal: HealthGoal
) -> GoalProgressResponse:
    """Calculates progress percentage using real database telemetry."""
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    days_7_ago_str = (now - timedelta(days=6)).strftime("%Y-%m-%d")

    current_val: Optional[float] = None
    has_data = False
    data_quality = "no_data"
    msg = "No telemetry logged yet."

    g_type = goal.goal_type.lower()

    if g_type == "hydration":
        res = await db.execute(
            select(
                func.sum(WaterLog.amount_ml),
                func.count(distinct(func.date(WaterLog.date))),
            ).where(
                WaterLog.user_id == user_id,
                func.date(WaterLog.date) >= days_7_ago_str,
                func.date(WaterLog.date) <= today_str,
            )
        )
        row = res.first()
        total_ml = row[0] if row and row[0] is not None else 0
        distinct_days = row[1] if row and row[1] is not None else 0

        if total_ml and distinct_days and distinct_days > 0:
            current_val = round(float(total_ml) / float(distinct_days), 1)
            has_data = True
            data_quality = "sufficient_data" if distinct_days >= 3 else "partial_data"
            msg = f"Averaging {current_val} mL/day across {distinct_days} logged days."
        else:
            msg = "No water logs recorded in the past 7 days. Log water intake to track progress."

    elif g_type == "activity":
        res = await db.execute(
            select(
                func.sum(ActivityLog.active_minutes),
                func.count(distinct(func.date(ActivityLog.date))),
            ).where(
                ActivityLog.user_id == user_id,
                func.date(ActivityLog.date) >= days_7_ago_str,
                func.date(ActivityLog.date) <= today_str,
            )
        )
        row = res.first()
        total_mins = row[0] if row and row[0] is not None else 0
        distinct_days = row[1] if row and row[1] is not None else 0

        if total_mins and total_mins > 0:
            current_val = float(total_mins)
            has_data = True
            data_quality = "sufficient_data" if distinct_days >= 3 else "partial_data"
            msg = f"Logged {current_val} active minutes across {distinct_days} days."
        else:
            msg = "No activity logged in the past 7 days."

    elif g_type in ["meal_consistency", "nutrition"]:
        res = await db.execute(
            select(func.count(distinct(func.date(Meal.consumed_at)))).where(
                Meal.user_id == user_id,
                func.date(Meal.consumed_at) >= days_7_ago_str,
                func.date(Meal.consumed_at) <= today_str,
            )
        )
        distinct_days = res.scalar() or 0
        if distinct_days > 0:
            current_val = float(distinct_days)
            has_data = True
            data_quality = "sufficient_data" if distinct_days >= 4 else "partial_data"
            msg = f"Meals logged on {distinct_days} of the last 7 days."
        else:
            msg = "No meals logged in food diary recently."

    elif g_type == "protein":
        stmt = (
            select(
                func.date(Meal.consumed_at).label("meal_date"),
                func.sum(MealEntry.protein_g).label("daily_protein"),
            )
            .join(MealEntry, MealEntry.meal_id == Meal.id)
            .where(
                Meal.user_id == user_id,
                func.date(Meal.consumed_at) >= days_7_ago_str,
                func.date(Meal.consumed_at) <= today_str,
            )
            .group_by(func.date(Meal.consumed_at))
        )
        res = await db.execute(stmt)
        rows = res.all()
        if rows:
            p_values = [r.daily_protein for r in rows if r.daily_protein]
            if p_values:
                current_val = round(sum(p_values) / len(p_values), 1)
                has_data = True
                data_quality = "sufficient_data" if len(p_values) >= 3 else "partial_data"
                msg = f"Averaging {current_val}g protein across {len(p_values)} logged days."
            else:
                msg = "No protein entries found in logged meals."
        else:
            msg = "Log meals to track daily protein intake."

    elif g_type == "weight_tracking":
        days_30_ago_str = (now - timedelta(days=29)).strftime("%Y-%m-%d")
        res = await db.execute(
            select(func.count(distinct(WeightLog.date))).where(
                WeightLog.user_id == user_id,
                WeightLog.date >= days_30_ago_str,
                WeightLog.date <= today_str,
            )
        )
        entries_count = res.scalar() or 0
        if entries_count > 0:
            current_val = float(entries_count)
            has_data = True
            data_quality = "sufficient_data" if entries_count >= 2 else "partial_data"
            msg = f"Recorded {entries_count} weight logs in the last 30 days."
        else:
            msg = "No weight logs recorded in the past 30 days."

    else:
        current_val = 0.0
        has_data = False
        data_quality = "no_data"
        msg = "Custom goal created. Update progress as you accomplish milestones."

    pct: Optional[float] = None
    if has_data and current_val is not None and goal.target_value > 0:
        pct = round(min(100.0, (current_val / goal.target_value) * 100.0), 1)

    return GoalProgressResponse(
        goal=GoalResponse.model_validate(goal),
        current_value=current_val,
        target_value=goal.target_value,
        progress_percentage=pct,
        unit=goal.unit,
        has_data=has_data,
        data_quality=data_quality,
        message=msg,
        period_start=days_7_ago_str,
        period_end=today_str,
    )

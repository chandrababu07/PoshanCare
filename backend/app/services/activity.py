from datetime import datetime, time, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.schemas.activity import (
    ActivityDailyResponse,
    ActivityHistoryResponse,
    ActivityLogResponse,
    UpsertActivityLogRequest,
)


def parse_date_string(date_str: str) -> datetime:
    """Parses YYYY-MM-DD string into start-of-day UTC datetime."""
    try:
        dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid date format '{date_str}'. Expected format YYYY-MM-DD.",
        )


def parse_period_days(period: str) -> int:
    mapping = {"7d": 7, "14d": 14, "30d": 30, "90d": 90, "6m": 180, "1y": 365}
    p_clean = (period or "30d").lower().strip()
    if p_clean not in mapping:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid period '{period}'. Allowed: 7d, 14d, 30d, 90d, 6m, 1y.",
        )
    return mapping[p_clean]


def map_activity_log_to_response(log: ActivityLog) -> ActivityLogResponse:
    return ActivityLogResponse(
        id=f"act-{log.id}",
        raw_id=log.id,
        user_id=log.user_id,
        date=log.date.strftime("%Y-%m-%d"),
        activity_level=log.activity_level,
        steps=log.steps,
        active_minutes=log.active_minutes,
        exercise_minutes=log.exercise_minutes,
        activity_type=log.activity_type,
        notes=log.notes,
        created_at=log.created_at,
    )


async def get_daily_activity_service(
    db: AsyncSession, user_id: int, date_str: str
) -> ActivityDailyResponse:
    """Retrieve daily activity telemetry record. Returns has_activity_data=False if unlogged."""
    dt_start = parse_date_string(date_str)
    dt_end = datetime.combine(dt_start.date(), time.max, tzinfo=timezone.utc)

    stmt = select(ActivityLog).where(
        ActivityLog.user_id == user_id,
        ActivityLog.date >= dt_start,
        ActivityLog.date <= dt_end,
    )
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()

    if not log:
        return ActivityDailyResponse(
            date=dt_start.strftime("%Y-%m-%d"),
            has_activity_data=False,
            log=None,
        )

    return ActivityDailyResponse(
        date=dt_start.strftime("%Y-%m-%d"),
        has_activity_data=True,
        log=map_activity_log_to_response(log),
    )


async def upsert_activity_log_service(
    db: AsyncSession, user_id: int, request: UpsertActivityLogRequest
) -> ActivityLogResponse:
    """Create or update daily activity log record with validation."""
    if request.steps is not None and request.steps < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Step count cannot be negative.",
        )
    if request.active_minutes is not None and request.active_minutes < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Active minutes cannot be negative.",
        )
    if request.exercise_minutes is not None and request.exercise_minutes < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Exercise minutes cannot be negative.",
        )

    dt_start = parse_date_string(request.date)
    dt_end = datetime.combine(dt_start.date(), time.max, tzinfo=timezone.utc)

    stmt = select(ActivityLog).where(
        ActivityLog.user_id == user_id,
        ActivityLog.date >= dt_start,
        ActivityLog.date <= dt_end,
    )
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()

    if log:
        if request.activity_level is not None:
            log.activity_level = request.activity_level.strip()
        if request.steps is not None:
            log.steps = request.steps
        if request.active_minutes is not None:
            log.active_minutes = request.active_minutes
        if request.exercise_minutes is not None:
            log.exercise_minutes = request.exercise_minutes
        if request.activity_type is not None:
            log.activity_type = request.activity_type.strip()
        if request.notes is not None:
            log.notes = request.notes.strip()
    else:
        log = ActivityLog(
            user_id=user_id,
            date=dt_start,
            activity_level=request.activity_level.strip() if request.activity_level else None,
            steps=request.steps,
            active_minutes=request.active_minutes,
            exercise_minutes=request.exercise_minutes,
            activity_type=request.activity_type.strip() if request.activity_type else None,
            notes=request.notes.strip() if request.notes else None,
        )
        db.add(log)

    await db.commit()
    await db.refresh(log)

    return map_activity_log_to_response(log)


async def get_activity_history_service(
    db: AsyncSession, user_id: int, period_str: str = "30d"
) -> ActivityHistoryResponse:
    """Retrieve activity log history and aggregate statistics for time period."""
    days_count = parse_period_days(period_str)
    now_utc = datetime.now(timezone.utc)
    start_date = (now_utc - timedelta(days=days_count)).replace(hour=0, minute=0, second=0, microsecond=0)

    stmt = (
        select(ActivityLog)
        .where(
            ActivityLog.user_id == user_id,
            ActivityLog.date >= start_date,
        )
        .order_by(ActivityLog.date.asc())
    )
    res = await db.execute(stmt)
    logs = list(res.scalars().all())

    logged_days_count = len(logs)
    steps_with_vals = [log.steps for log in logs if log.steps is not None]

    total_steps = sum(steps_with_vals)
    avg_steps = round(total_steps / len(steps_with_vals), 1) if steps_with_vals else None

    log_responses = [map_activity_log_to_response(log) for log in logs]

    return ActivityHistoryResponse(
        period=period_str,
        days_in_period=days_count,
        logged_days_count=logged_days_count,
        avg_steps=avg_steps,
        total_steps=total_steps,
        logs=log_responses,
    )

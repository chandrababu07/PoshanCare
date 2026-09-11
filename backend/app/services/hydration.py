from datetime import datetime, time, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hydration import WaterLog
from app.schemas.hydration import (
    CreateWaterLogRequest,
    HydrationDailyResponse,
    WaterLogResponse,
)


def parse_date_string(date_str: str) -> datetime:
    """Parses YYYY-MM-DD string into start-of-day UTC datetime."""
    try:
        dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid date format '{date_str}'. Expected format YYYY-MM-DD.",
        )


def map_water_log_to_response(log: WaterLog) -> WaterLogResponse:
    return WaterLogResponse(
        id=f"w-{log.id}",
        raw_id=log.id,
        user_id=log.user_id,
        date=log.date.strftime("%Y-%m-%d"),
        amount_ml=log.amount_ml,
        note=log.note,
        created_at=log.created_at,
    )


async def get_daily_hydration_service(
    db: AsyncSession, user_id: int, date_str: str
) -> HydrationDailyResponse:
    """Retrieve user's water logs and total hydration for a specific date."""
    dt_start = parse_date_string(date_str)
    dt_end = datetime.combine(dt_start.date(), time.max, tzinfo=timezone.utc)

    stmt = (
        select(WaterLog)
        .where(
            WaterLog.user_id == user_id,
            WaterLog.date >= dt_start,
            WaterLog.date <= dt_end,
        )
        .order_by(WaterLog.created_at.asc())
    )
    res = await db.execute(stmt)
    logs = list(res.scalars().all())

    total_ml = sum(log.amount_ml for log in logs)
    has_data = len(logs) > 0

    log_responses = [map_water_log_to_response(log) for log in logs]

    return HydrationDailyResponse(
        date=dt_start.strftime("%Y-%m-%d"),
        total_water_ml=total_ml,
        target_water_ml=2500,
        has_data=has_data,
        logs=log_responses,
    )


async def add_water_log_service(
    db: AsyncSession, user_id: int, request: CreateWaterLogRequest
) -> WaterLogResponse:
    """Add a new water intake increment log record."""
    if request.amount_ml <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Hydration intake amount must be greater than 0 ml.",
        )

    dt_date = parse_date_string(request.date)

    water_log = WaterLog(
        user_id=user_id,
        date=dt_date,
        amount_ml=request.amount_ml,
        note=request.note.strip() if request.note else None,
    )
    db.add(water_log)
    await db.commit()
    await db.refresh(water_log)

    return map_water_log_to_response(water_log)


async def delete_water_log_service(
    db: AsyncSession, user_id: int, log_id: int
) -> bool:
    """Delete a user-owned water log record."""
    stmt = select(WaterLog).where(
        WaterLog.id == log_id, WaterLog.user_id == user_id
    )
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Water log with ID {log_id} not found or unauthorized.",
        )

    await db.delete(log)
    await db.commit()
    return True

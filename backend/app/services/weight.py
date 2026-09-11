from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import UserProfile
from app.models.weight import WeightLog
from app.schemas.weight import (
    CreateWeightLogRequest,
    WeightLogResponse,
    WeightSummaryResponse,
)


def parse_date_string(date_str: str) -> datetime:
    """Parses YYYY-MM-DD into UTC start-of-day datetime."""
    try:
        dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid date format '{date_str}'. Expected format YYYY-MM-DD.",
        )


def compute_moving_averages(logs_sorted: List[WeightLog]) -> List[float]:
    """Computes 7-entry moving average array for chronologically sorted logs."""
    moving_averages: List[float] = []
    weights = [log.weight_kg for log in logs_sorted]

    for i in range(len(weights)):
        # Take up to 7 trailing entries
        start_idx = max(0, i - 6)
        window = weights[start_idx : i + 1]
        avg = sum(window) / len(window)
        moving_averages.append(round(avg, 1))

    return moving_averages


async def log_weight_entry_service(
    db: AsyncSession, user_id: int, request: CreateWeightLogRequest
) -> WeightLogResponse:
    """Log or update a daily body weight measurement."""
    dt_log = parse_date_string(request.date)

    # Check if entry already exists for this date
    stmt = select(WeightLog).where(
        WeightLog.user_id == user_id,
        WeightLog.date == dt_log,
    )
    res = await db.execute(stmt)
    entry = res.scalar_one_or_none()

    if entry:
        entry.weight_kg = request.weight_kg
        if request.note is not None:
            entry.note = request.note
    else:
        entry = WeightLog(
            user_id=user_id,
            date=dt_log,
            weight_kg=request.weight_kg,
            note=request.note,
        )
        db.add(entry)

    await db.commit()
    await db.refresh(entry)

    # Fetch all logs to re-calculate moving average
    all_stmt = select(WeightLog).where(WeightLog.user_id == user_id).order_by(WeightLog.date.asc())
    all_res = await db.execute(all_stmt)
    all_logs = list(all_res.scalars().all())

    ma_list = compute_moving_averages(all_logs)
    target_ma = next((ma for log, ma in zip(all_logs, ma_list) if log.id == entry.id), entry.weight_kg)

    return WeightLogResponse(
        id=f"w-{entry.id}",
        raw_id=entry.id,
        user_id=entry.user_id,
        date=entry.date.strftime("%b %d, %Y"),
        weight_kg=entry.weight_kg,
        moving_average=target_ma,
        note=entry.note,
        created_at=entry.created_at,
    )


async def get_weight_summary_service(
    db: AsyncSession, user_id: int
) -> WeightSummaryResponse:
    """Retrieve full weight history, moving averages, and trajectory metrics."""
    stmt = select(WeightLog).where(WeightLog.user_id == user_id).order_by(WeightLog.date.asc())
    res = await db.execute(stmt)
    all_logs = list(res.scalars().all())

    # Fetch user target weight from profile
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    prof_res = await db.execute(profile_stmt)
    profile = prof_res.scalar_one_or_none()
    target_weight = profile.target_mass_kg if (profile and profile.target_mass_kg) else 68.0

    if not all_logs:
        return WeightSummaryResponse(
            current_weight=0.0,
            target_weight=target_weight,
            start_weight=0.0,
            net_change=0.0,
            weekly_velocity=0.0,
            progress_pct=0.0,
            days_tracked=0,
            logs=[],
        )

    ma_list = compute_moving_averages(all_logs)
    start_weight = all_logs[0].weight_kg
    current_weight = all_logs[-1].weight_kg
    net_change = round(current_weight - start_weight, 1)

    # Weekly velocity calculation over available logs
    if len(all_logs) > 1:
        days_span = (all_logs[-1].date - all_logs[0].date).days
        weeks = max(1.0, days_span / 7.0)
        weekly_velocity = round(net_change / weeks, 2)
    else:
        weekly_velocity = 0.0

    # Progress percentage towards target weight
    total_needed = abs(target_weight - start_weight)
    if total_needed > 0:
        progress_pct = round(min(100.0, max(0.0, (abs(current_weight - start_weight) / total_needed) * 100.0)), 1)
    else:
        progress_pct = 100.0

    log_responses: List[WeightLogResponse] = []
    # Build logs descending for UI timeline display
    for log, ma in reversed(list(zip(all_logs, ma_list))):
        log_responses.append(
            WeightLogResponse(
                id=f"w-{log.id}",
                raw_id=log.id,
                user_id=log.user_id,
                date=log.date.strftime("%b %d, %Y"),
                weight_kg=log.weight_kg,
                moving_average=ma,
                note=log.note,
                created_at=log.created_at,
            )
        )

    return WeightSummaryResponse(
        current_weight=current_weight,
        target_weight=target_weight,
        start_weight=start_weight,
        net_change=net_change,
        weekly_velocity=weekly_velocity,
        progress_pct=progress_pct,
        days_tracked=len(all_logs),
        logs=log_responses,
    )


async def delete_weight_entry_service(
    db: AsyncSession, user_id: int, weight_id: int
) -> bool:
    """Delete a user-owned weight log."""
    stmt = select(WeightLog).where(WeightLog.id == weight_id, WeightLog.user_id == user_id)
    res = await db.execute(stmt)
    entry = res.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weight log with ID {weight_id} not found or unauthorized.",
        )

    await db.delete(entry)
    await db.commit()
    return True

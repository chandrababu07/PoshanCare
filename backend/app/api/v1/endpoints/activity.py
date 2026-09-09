from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.activity import (
    ActivityDailyResponse,
    ActivityHistoryResponse,
    ActivityLogResponse,
    UpsertActivityLogRequest,
)
from app.services.activity import (
    get_activity_history_service,
    get_daily_activity_service,
    upsert_activity_log_service,
)

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", response_model=ActivityDailyResponse, status_code=status.HTTP_200_OK)
async def get_daily_activity(
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve daily activity telemetry record for authenticated user."""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return await get_daily_activity_service(db=db, user_id=current_user.id, date_str=date)


@router.post("", response_model=ActivityLogResponse, status_code=status.HTTP_200_OK)
@router.put("", response_model=ActivityLogResponse, status_code=status.HTTP_200_OK)
async def upsert_activity_log(
    request: UpsertActivityLogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update daily activity log record. Protected route."""
    return await upsert_activity_log_service(db=db, user_id=current_user.id, request=request)


@router.get("/history", response_model=ActivityHistoryResponse, status_code=status.HTTP_200_OK)
async def get_activity_history(
    period: str = Query("30d", pattern="^(7d|14d|30d|90d|6m|1y)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve activity history timeline for authenticated user."""
    return await get_activity_history_service(db=db, user_id=current_user.id, period_str=period)

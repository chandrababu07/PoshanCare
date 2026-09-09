from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.hydration import (
    CreateWaterLogRequest,
    HydrationDailyResponse,
    WaterLogResponse,
)
from app.services.hydration import (
    add_water_log_service,
    delete_water_log_service,
    get_daily_hydration_service,
)

router = APIRouter(prefix="/hydration", tags=["hydration"])


@router.get("", response_model=HydrationDailyResponse, status_code=status.HTTP_200_OK)
async def get_daily_hydration(
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve authenticated user's hydration log records and daily summary."""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return await get_daily_hydration_service(db=db, user_id=current_user.id, date_str=date)


@router.post("", response_model=WaterLogResponse, status_code=status.HTTP_201_CREATED)
async def add_water_log(
    request: CreateWaterLogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a water intake increment record. Protected route."""
    return await add_water_log_service(db=db, user_id=current_user.id, request=request)


@router.delete("/{log_id}", status_code=status.HTTP_200_OK)
async def delete_water_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user-owned water log record. Protected route."""
    await delete_water_log_service(db=db, user_id=current_user.id, log_id=log_id)
    return {"status": "success", "message": f"Water log {log_id} deleted successfully."}

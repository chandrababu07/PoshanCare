from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.diary import (
    CreateDiaryEntryRequest,
    DailyDiaryResponse,
    MealEntryResponse,
    UpdateDiaryEntryRequest,
)
from app.services.diary import (
    create_diary_entry_service,
    delete_diary_entry_service,
    get_daily_diary_service,
    update_diary_entry_service,
)

router = APIRouter(prefix="/diary", tags=["diary"])


@router.get("", response_model=DailyDiaryResponse, status_code=status.HTTP_200_OK)
async def get_daily_diary(
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve authenticated user's daily food diary for requested date. Protected route.
    """
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return await get_daily_diary_service(db=db, user_id=current_user.id, date_str=date)


@router.post("/entries", response_model=MealEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary_entry(
    request: CreateDiaryEntryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new food entry in user's food diary. Protected route.
    """
    return await create_diary_entry_service(
        db=db, user_id=current_user.id, request=request
    )


@router.patch("/entries/{entry_id}", response_model=MealEntryResponse, status_code=status.HTTP_200_OK)
async def update_diary_entry(
    entry_id: int,
    request: UpdateDiaryEntryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update quantity or portion of an existing diary entry. Protected route.
    """
    return await update_diary_entry_service(
        db=db, user_id=current_user.id, entry_id=entry_id, request=request
    )


@router.delete("/entries/{entry_id}", status_code=status.HTTP_200_OK)
async def delete_diary_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a diary entry owned by the user. Protected route.
    """
    await delete_diary_entry_service(db=db, user_id=current_user.id, entry_id=entry_id)
    return {"status": "success", "message": f"Diary entry {entry_id} deleted successfully."}

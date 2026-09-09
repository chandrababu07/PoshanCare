from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.weight import (
    CreateWeightLogRequest,
    WeightLogResponse,
    WeightSummaryResponse,
)
from app.services.weight import (
    delete_weight_entry_service,
    get_weight_summary_service,
    log_weight_entry_service,
)

router = APIRouter(prefix="/weight", tags=["weight"])


@router.get("", response_model=WeightSummaryResponse, status_code=status.HTTP_200_OK)
async def get_weight_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve authenticated user's weight log history and trajectory summary. Protected route.
    """
    return await get_weight_summary_service(db=db, user_id=current_user.id)


@router.post("", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
async def log_weight_entry(
    request: CreateWeightLogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log or update a daily body weight measurement. Protected route.
    """
    return await log_weight_entry_service(db=db, user_id=current_user.id, request=request)


@router.delete("/{weight_id}", status_code=status.HTTP_200_OK)
async def delete_weight_entry(
    weight_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a user-owned weight log. Protected route.
    """
    await delete_weight_entry_service(db=db, user_id=current_user.id, weight_id=weight_id)
    return {"status": "success", "message": f"Weight log {weight_id} deleted successfully."}

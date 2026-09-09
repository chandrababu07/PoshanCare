from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.nutrition import (
    NutritionSummaryResponse,
    NutritionTargetsResponse,
    StatelessCalculateRequest,
)
from app.schemas.nutrition_intelligence import NutritionIntelligenceResponse
from app.services.nutrition import (
    calculate_stateless_targets,
    calculate_user_nutrition_targets,
    get_daily_nutrition_summary,
)
from app.services.nutrition_intelligence import get_nutrition_intelligence_service

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.get("/targets", response_model=NutritionTargetsResponse, status_code=status.HTTP_200_OK)
async def get_user_nutrition_targets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve authenticated user's personalized nutrition targets (BMR, TDEE, Calorie Goal, Macros). Protected route.
    """
    return await calculate_user_nutrition_targets(db=db, user_id=current_user.id)


@router.get("/summary", response_model=NutritionSummaryResponse, status_code=status.HTTP_200_OK)
async def get_nutrition_summary(
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve actual-vs-target nutrition adherence summary for date. Protected route.
    """
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return await get_daily_nutrition_summary(db=db, user_id=current_user.id, date_str=date)


@router.get("/intelligence", response_model=NutritionIntelligenceResponse, status_code=status.HTTP_200_OK)
async def get_nutrition_intelligence(
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve personalized nutrition intelligence, rule-based insights, and safe food recommendations for authenticated user.
    """
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return await get_nutrition_intelligence_service(db=db, current_user=current_user, date_str=date)


@router.post("/calculate", response_model=NutritionTargetsResponse, status_code=status.HTTP_200_OK)
async def calculate_custom_nutrition(
    request: StatelessCalculateRequest,
):
    """
    Stateless nutrition calculation preview for custom biometrics and goals.
    """
    return calculate_stateless_targets(request)


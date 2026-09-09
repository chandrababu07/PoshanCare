from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.meal_plan import (
    AddMealPlanItemRequest,
    GenerateMealPlanRequest,
    MealPlanResponse,
    MealRecommendationResponse,
)
from app.services.meal_planner import (
    add_meal_plan_item_service,
    delete_meal_plan_service,
    generate_meal_plan_service,
    get_meal_recommendations_service,
    get_today_meal_plan_service,
    get_user_meal_plans_service,
)

router = APIRouter(prefix="/meal-plans", tags=["Meal Plans"])


@router.get("/today", response_model=MealPlanResponse)
async def get_today_meal_plan(
    date_str: Optional[str] = Query(None, alias="date", description="YYYY-MM-DD date filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve or auto-generate today's meal plan for current user."""
    return await get_today_meal_plan_service(db, current_user, date_str)


@router.get("", response_model=List[MealPlanResponse])
async def get_user_meal_plans(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve historical meal plans for current user."""
    return await get_user_meal_plans_service(db, current_user, limit)


@router.post("/generate", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
async def generate_meal_plan(
    request: GenerateMealPlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate or regenerate a personalized meal plan for specified date."""
    return await generate_meal_plan_service(db, current_user, request)


@router.get("/recommendations", response_model=MealRecommendationResponse)
async def get_meal_recommendations(
    date_str: Optional[str] = Query(None, alias="date", description="YYYY-MM-DD date filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve personalized, persona-safe food recommendations for current user."""
    return await get_meal_recommendations_service(db, current_user, date_str)


@router.post("/{plan_id}/items", response_model=MealPlanResponse)
async def add_meal_plan_item(
    plan_id: int,
    request: AddMealPlanItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new item to an existing meal plan with strict ownership check."""
    return await add_meal_plan_item_service(db, current_user, plan_id, request)


@router.delete("/{plan_id}")
async def delete_meal_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a meal plan owned by current user."""
    return await delete_meal_plan_service(db, current_user, plan_id)

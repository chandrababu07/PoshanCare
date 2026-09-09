from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate,
    RecipeLogToMealRequest,
    RecipeResponse,
    RecipeUpdate,
)
from app.services.recipe import (
    create_recipe_service,
    delete_recipe_service,
    get_recipe_by_id_service,
    get_user_recipes_service,
    log_recipe_to_meal_service,
    update_recipe_service,
)

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.get("", response_model=List[RecipeResponse], status_code=status.HTTP_200_OK)
async def get_user_recipes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all custom recipes saved by the authenticated user."""
    return await get_user_recipes_service(db=db, user_id=current_user.id)


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    payload: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom recipe with ingredients and composite nutrient calculation."""
    return await create_recipe_service(db=db, user_id=current_user.id, payload=payload)


@router.get("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def get_recipe_by_id(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a single recipe owned by the current user."""
    return await get_recipe_by_id_service(db=db, user_id=current_user.id, recipe_id=recipe_id)


@router.put("/{recipe_id}", response_model=RecipeResponse, status_code=status.HTTP_200_OK)
async def update_recipe(
    recipe_id: int,
    payload: RecipeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a custom recipe and its ingredients."""
    return await update_recipe_service(
        db=db, user_id=current_user.id, recipe_id=recipe_id, payload=payload
    )


@router.delete("/{recipe_id}", status_code=status.HTTP_200_OK)
async def delete_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom recipe."""
    return await delete_recipe_service(db=db, user_id=current_user.id, recipe_id=recipe_id)


@router.post("/{recipe_id}/log", status_code=status.HTTP_200_OK)
async def log_recipe_to_meal(
    recipe_id: int,
    payload: RecipeLogToMealRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log one or more servings of a custom recipe directly into the user's food diary."""
    return await log_recipe_to_meal_service(
        db=db, user_id=current_user.id, recipe_id=recipe_id, payload=payload
    )

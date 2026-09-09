import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.food import FoodResponse, PaginatedFoodResponse
from app.services.food import (
    get_food_by_id_service,
    get_unique_categories_service,
    get_unique_regions_service,
    list_foods_service,
)

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("", response_model=PaginatedFoodResponse, status_code=status.HTTP_200_OK)
async def list_foods(
    search: Optional[str] = Query(None, max_length=100, description="Search term for dish name, alternate name, or IFCT code"),
    category: Optional[str] = Query(None, max_length=100, description="Filter by food category"),
    region: Optional[str] = Query(None, max_length=100, description="Filter by regional origin"),
    is_vegetarian: Optional[bool] = Query(None, description="Filter by vegetarian restriction"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query("name", description="Field to sort by (name, calories, protein_g, carbs_g, fat_g)"),
    sort_order: str = Query("asc", description="Sort direction (asc, desc)"),
    db: AsyncSession = Depends(get_db),
):
    """
    List, search, filter, and paginate Indian foods dataset. Public endpoint.
    """
    foods, total = await list_foods_service(
        db=db,
        search=search,
        category=category,
        region=region,
        is_vegetarian=is_vegetarian,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedFoodResponse(
        items=[FoodResponse.model_validate(f) for f in foods],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/categories", response_model=List[str], status_code=status.HTTP_200_OK)
async def get_categories(db: AsyncSession = Depends(get_db)):
    """List unique food categories. Public endpoint."""
    return await get_unique_categories_service(db)


@router.get("/regions", response_model=List[str], status_code=status.HTTP_200_OK)
async def get_regions(db: AsyncSession = Depends(get_db)):
    """List unique regional origins. Public endpoint."""
    return await get_unique_regions_service(db)


@router.get("/{food_id}", response_model=FoodResponse, status_code=status.HTTP_200_OK)
async def get_food_by_id(food_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed food record by ID. Public endpoint."""
    food = await get_food_by_id_service(db, food_id)
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food item with ID {food_id} not found.",
        )
    return FoodResponse.model_validate(food)

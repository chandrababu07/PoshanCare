import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.food import (
    CreateCustomFoodRequest,
    FoodResponse,
    PaginatedFoodResponse,
)
from app.services.food import (
    add_favorite_food_service,
    create_custom_food_service,
    get_favorite_foods_service,
    get_food_by_id_service,
    get_recent_foods_service,
    get_unique_categories_service,
    get_unique_regions_service,
    list_foods_service,
    remove_favorite_food_service,
)

router = APIRouter(prefix="/foods", tags=["foods"])


def build_food_response(food, favorite_food_ids: set, current_user_id: Optional[int] = None) -> FoodResponse:
    is_custom = food.user_id is not None and food.user_id == current_user_id
    is_favorite = food.id in favorite_food_ids
    resp = FoodResponse.model_validate(food)
    resp.is_custom = is_custom
    resp.is_favorite = is_favorite
    return resp


@router.get("", response_model=PaginatedFoodResponse, status_code=status.HTTP_200_OK)
@router.get("/search", response_model=PaginatedFoodResponse, status_code=status.HTTP_200_OK)
async def list_foods(
    search: Optional[str] = Query(None, max_length=100, description="Search term for dish name, alternate name, or IFCT code"),
    q: Optional[str] = Query(None, max_length=100, description="Alias search query term"),
    category: Optional[str] = Query(None, max_length=100, description="Filter by food category"),
    region: Optional[str] = Query(None, max_length=100, description="Filter by regional origin or cuisine"),
    is_vegetarian: Optional[bool] = Query(None, description="Filter by vegetarian restriction"),
    is_custom_only: bool = Query(False, description="Filter to show user custom foods only"),
    is_favorite_only: bool = Query(False, description="Filter to show favorited foods only"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query("name", description="Field to sort by (name, calories, protein_g, carbs_g, fat_g)"),
    sort_order: str = Query("asc", description="Sort direction (asc, desc)"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List, search, filter, and paginate foods.
    Supports case-insensitive search, category, regional cuisine, custom food, and favorites filtering.
    """
    search_term = (q or search).strip() if (q or search) else None
    user_id = current_user.id if current_user else None

    foods, fav_ids, total = await list_foods_service(
        db=db,
        search=search_term,
        category=category,
        region=region,
        is_vegetarian=is_vegetarian,
        is_custom_only=is_custom_only,
        is_favorite_only=is_favorite_only,
        current_user_id=user_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0
    items = [build_food_response(f, fav_ids, user_id) for f in foods]

    return PaginatedFoodResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=FoodResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_food(
    request: CreateCustomFoodRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user custom food item. Requires authentication.
    Calculations and non-negative macro validations are enforced server-side.
    """
    food = await create_custom_food_service(db=db, user_id=current_user.id, request=request)
    return build_food_response(food, set(), current_user.id)


@router.get("/recent", response_model=List[FoodResponse], status_code=status.HTTP_200_OK)
async def get_recent_foods(
    limit: int = Query(20, ge=1, le=50, description="Max recent items to fetch"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List foods recently logged by the authenticated user. Protected route.
    """
    foods, fav_ids = await get_recent_foods_service(db=db, user_id=current_user.id, limit=limit)
    return [build_food_response(f, fav_ids, current_user.id) for f in foods]


@router.get("/favorites", response_model=List[FoodResponse], status_code=status.HTTP_200_OK)
async def get_favorite_foods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all foods favorited by the authenticated user. Protected route.
    """
    foods = await get_favorite_foods_service(db=db, user_id=current_user.id)
    fav_ids = {f.id for f in foods}
    return [build_food_response(f, fav_ids, current_user.id) for f in foods]


@router.post("/{food_id}/favorite", status_code=status.HTTP_200_OK)
async def add_favorite_food(
    food_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a food to user's favorites list. Protected route.
    """
    await add_favorite_food_service(db=db, user_id=current_user.id, food_id=food_id)
    return {"status": "success", "message": f"Food {food_id} added to favorites."}


@router.delete("/{food_id}/favorite", status_code=status.HTTP_200_OK)
async def remove_favorite_food(
    food_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a food from user's favorites list. Protected route.
    """
    await remove_favorite_food_service(db=db, user_id=current_user.id, food_id=food_id)
    return {"status": "success", "message": f"Food {food_id} removed from favorites."}


@router.get("/categories", response_model=List[str], status_code=status.HTTP_200_OK)
async def get_categories(db: AsyncSession = Depends(get_db)):
    """List unique food categories. Public endpoint."""
    return await get_unique_categories_service(db)


@router.get("/regions", response_model=List[str], status_code=status.HTTP_200_OK)
async def get_regions(db: AsyncSession = Depends(get_db)):
    """List unique regional origins / cuisines. Public endpoint."""
    return await get_unique_regions_service(db)


@router.get("/{food_id}", response_model=FoodResponse, status_code=status.HTTP_200_OK)
async def get_food_by_id(
    food_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed food record by ID. Data isolation enforced."""
    user_id = current_user.id if current_user else None
    food = await get_food_by_id_service(db, food_id, current_user_id=user_id)
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food item with ID {food_id} not found.",
        )
    return build_food_response(food, set(), user_id)

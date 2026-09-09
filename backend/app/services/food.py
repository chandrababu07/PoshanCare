from typing import List, Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.diary import Meal, MealEntry
from app.models.food import Food, FoodPortion, UserFavoriteFood
from app.schemas.food import CreateCustomFoodRequest
from app.db.seed_foods import seed_foods_table


async def list_foods_service(
    db: AsyncSession,
    search: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    is_vegetarian: Optional[bool] = None,
    is_custom_only: bool = False,
    is_favorite_only: bool = False,
    current_user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "name",
    sort_order: str = "asc",
) -> Tuple[List[Food], Set[int], int]:
    """
    List, search, filter, and paginate foods from database with strict user data isolation.
    Returns (foods, set_of_favorite_food_ids, total_count).
    """
    await seed_foods_table(db)

    stmt = select(Food).options(selectinload(Food.portions))

    # User isolation: return public system foods OR user's own custom foods
    if is_custom_only:
        if not current_user_id:
            return [], set(), 0
        stmt = stmt.where(Food.user_id == current_user_id)
    elif current_user_id:
        stmt = stmt.where(or_(Food.user_id.is_(None), Food.user_id == current_user_id))
    else:
        stmt = stmt.where(Food.user_id.is_(None))

    # Favorite filter
    favorite_food_ids: Set[int] = set()
    if current_user_id:
        fav_stmt = select(UserFavoriteFood.food_id).where(UserFavoriteFood.user_id == current_user_id)
        fav_res = await db.execute(fav_stmt)
        favorite_food_ids = set(fav_res.scalars().all())

    if is_favorite_only:
        if not favorite_food_ids:
            return [], set(), 0
        stmt = stmt.where(Food.id.in_(favorite_food_ids))

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Food.name.ilike(term),
                Food.alternate_name.ilike(term),
                Food.category.ilike(term),
                Food.region.ilike(term),
                Food.ifct_code.ilike(term),
            )
        )

    if category and category.strip() and category.strip().lower() != "all":
        stmt = stmt.where(Food.category.ilike(f"%{category.strip()}%"))

    if region and region.strip() and region.strip().lower() != "all":
        stmt = stmt.where(Food.region.ilike(f"%{region.strip()}%"))

    if is_vegetarian is not None:
        stmt = stmt.where(Food.is_vegetarian == is_vegetarian)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    valid_sort_fields = {
        "name": Food.name,
        "calories": Food.calories,
        "protein_g": Food.protein_g,
        "carbs_g": Food.carbs_g,
        "fat_g": Food.fat_g,
        "created_at": Food.created_at,
    }
    sort_col = valid_sort_fields.get(sort_by.lower(), Food.name)
    if sort_order.lower() == "desc":
        stmt = stmt.order_by(sort_col.desc())
    else:
        stmt = stmt.order_by(sort_col.asc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    foods = list(result.scalars().all())

    return foods, favorite_food_ids, total


async def create_custom_food_service(
    db: AsyncSession, user_id: int, request: CreateCustomFoodRequest
) -> Food:
    """Creates a user-custom food item with server-side validation."""
    food = Food(
        user_id=user_id,
        name=request.name.strip(),
        alternate_name=request.alternate_name.strip() if request.alternate_name else None,
        description=request.description.strip() if request.description else None,
        category=request.category.strip() if request.category else "Custom",
        region=request.region.strip() if request.region else "Custom",
        is_vegetarian=request.is_vegetarian,
        serving_size_name=request.serving_size_name.strip(),
        serving_size_g=request.serving_size_g,
        calories=round(request.calories, 1),
        protein_g=round(request.protein_g, 1),
        carbs_g=round(request.carbs_g, 1),
        fat_g=round(request.fat_g, 1),
        fiber_g=round(request.fiber_g, 1),
        sugar_g=round(request.sugar_g, 1),
        sodium_mg=round(request.sodium_mg, 1),
        source="user_custom",
        is_verified=False,
    )
    db.add(food)
    await db.commit()
    await db.refresh(food)

    # Add default portion matching serving_size_name
    portion = FoodPortion(
        food_id=food.id,
        portion_name=food.serving_size_name,
        gram_weight=food.serving_size_g,
        is_default=True,
    )
    db.add(portion)
    await db.commit()
    await db.refresh(food)

    return food


async def get_recent_foods_service(
    db: AsyncSession, user_id: int, limit: int = 20
) -> Tuple[List[Food], Set[int]]:
    """Retrieve distinct foods recently logged in user's diary."""
    stmt = (
        select(Food)
        .join(MealEntry, MealEntry.food_id == Food.id)
        .join(Meal, Meal.id == MealEntry.meal_id)
        .where(Meal.user_id == user_id)
        .group_by(Food.id)
        .order_by(func.max(MealEntry.created_at).desc())
        .limit(limit)
        .options(selectinload(Food.portions))
    )
    res = await db.execute(stmt)
    foods = list(res.scalars().all())

    fav_stmt = select(UserFavoriteFood.food_id).where(UserFavoriteFood.user_id == user_id)
    fav_res = await db.execute(fav_stmt)
    favorite_food_ids = set(fav_res.scalars().all())

    return foods, favorite_food_ids


async def get_favorite_foods_service(
    db: AsyncSession, user_id: int
) -> List[Food]:
    """Retrieve all foods favorited by the user."""
    stmt = (
        select(Food)
        .join(UserFavoriteFood, UserFavoriteFood.food_id == Food.id)
        .where(UserFavoriteFood.user_id == user_id)
        .order_by(UserFavoriteFood.created_at.desc())
        .options(selectinload(Food.portions))
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def add_favorite_food_service(
    db: AsyncSession, user_id: int, food_id: int
) -> bool:
    """Add a food to user's favorites."""
    food = await get_food_by_id_service(db, food_id)
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food item with ID {food_id} not found.",
        )

    # Data isolation check: if food is custom, user must own it
    if food.user_id is not None and food.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food item with ID {food_id} not found.",
        )

    stmt = select(UserFavoriteFood).where(
        UserFavoriteFood.user_id == user_id, UserFavoriteFood.food_id == food_id
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if not existing:
        fav = UserFavoriteFood(user_id=user_id, food_id=food_id)
        db.add(fav)
        await db.commit()

    return True


async def remove_favorite_food_service(
    db: AsyncSession, user_id: int, food_id: int
) -> bool:
    """Remove a food from user's favorites."""
    stmt = select(UserFavoriteFood).where(
        UserFavoriteFood.user_id == user_id, UserFavoriteFood.food_id == food_id
    )
    res = await db.execute(stmt)
    fav = res.scalar_one_or_none()

    if fav:
        await db.delete(fav)
        await db.commit()

    return True


async def get_food_by_id_service(db: AsyncSession, food_id: int, current_user_id: Optional[int] = None) -> Optional[Food]:
    """Retrieve food details by ID with user isolation check."""
    await seed_foods_table(db)
    stmt = select(Food).where(Food.id == food_id).options(selectinload(Food.portions))
    result = await db.execute(stmt)
    food = result.scalar_one_or_none()

    if food and food.user_id is not None and current_user_id != food.user_id:
        return None

    return food


async def get_unique_categories_service(db: AsyncSession) -> List[str]:
    """List unique food categories."""
    await seed_foods_table(db)
    stmt = select(Food.category).distinct().order_by(Food.category.asc())
    result = await db.execute(stmt)
    return [c for c in result.scalars().all() if c]


async def get_unique_regions_service(db: AsyncSession) -> List[str]:
    """List unique food regions."""
    await seed_foods_table(db)
    stmt = select(Food.region).distinct().order_by(Food.region.asc())
    result = await db.execute(stmt)
    return [r for r in result.scalars().all() if r]

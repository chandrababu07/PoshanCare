from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.food import Food
from app.db.seed_foods import seed_foods_table


async def list_foods_service(
    db: AsyncSession,
    search: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    is_vegetarian: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "name",
    sort_order: str = "asc",
) -> Tuple[List[Food], int]:
    """
    List, search, filter, and paginate foods from database.
    Auto-seeds initial foods if table is empty.
    """
    await seed_foods_table(db)

    stmt = select(Food).options(selectinload(Food.portions))

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

    return foods, total


async def get_food_by_id_service(db: AsyncSession, food_id: int) -> Optional[Food]:
    """Retrieve food details by ID."""
    await seed_foods_table(db)
    stmt = select(Food).where(Food.id == food_id).options(selectinload(Food.portions))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


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

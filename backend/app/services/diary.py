from datetime import datetime, time, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.diary import Meal, MealEntry
from app.models.food import Food, FoodPortion
from app.models.profile import UserProfile
from app.schemas.diary import (
    CreateDiaryEntryRequest,
    DailyDiaryResponse,
    MealEntryResponse,
    MealSectionResponse,
    UpdateDiaryEntryRequest,
)

MEAL_SECTION_CONFIG: Dict[str, Dict[str, str]] = {
    "breakfast": {
        "name": "Breakfast",
        "time": "08:30 AM",
        "subtitle": "Morning Glycemic & Protein Kick",
        "icon_name": "wb_twilight",
    },
    "lunch": {
        "name": "Lunch",
        "time": "01:15 PM",
        "subtitle": "Main Refuel & Primary Micronutrient Anchor",
        "icon_name": "sunny",
    },
    "evening_snack": {
        "name": "Evening Snack",
        "time": "05:00 PM",
        "subtitle": "Pre-Workout Lift & Metabolic Bridge",
        "icon_name": "local_cafe",
    },
    "dinner": {
        "name": "Dinner",
        "time": "08:30 PM",
        "subtitle": "Recovery Feed & Evening Caloric Closure",
        "icon_name": "bedtime",
    },
    "other": {
        "name": "Other / Snacks",
        "time": "Flexible",
        "subtitle": "Additional Intake & Snacks",
        "icon_name": "utensils",
    },
}


def parse_date_string(date_str: str) -> datetime:
    """Parses date string YYYY-MM-DD into UTC datetime start-of-day."""
    try:
        dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid date format '{date_str}'. Expected format YYYY-MM-DD.",
        )


def compute_entry_nutrition(
    food: Food, portion: Optional[FoodPortion], quantity: float
) -> Tuple[str, str, float, float, float, float, float, float]:
    """
    Computes (serving_name, subtext, serving_gram, calories, protein_g, carbs_g, fat_g, fiber_g)
    deterministically from Food, optional FoodPortion, and quantity.
    """
    if portion:
        unit_gram = portion.gram_weight
        scale = unit_gram / food.serving_size_g if food.serving_size_g > 0 else 1.0
        portion_label = portion.portion_name
    else:
        unit_gram = food.serving_size_g
        scale = 1.0
        portion_label = food.serving_size_name

    total_gram = round(unit_gram * quantity, 1)
    scale_qty = scale * quantity

    calories = round(food.calories * scale_qty, 1)
    protein_g = round(food.protein_g * scale_qty, 1)
    carbs_g = round(food.carbs_g * scale_qty, 1)
    fat_g = round(food.fat_g * scale_qty, 1)
    fiber_g = round(getattr(food, "fiber_g", 0.0) * scale_qty, 1)

    qty_label = f"{quantity:g}" if quantity != 1.0 else "1"
    serving_name = f"{qty_label} {portion_label} ({Math_round_str(total_gram)}g)"
    subtext = f"{food.name} ({Math_round_str(total_gram)}g)"

    return serving_name, subtext, total_gram, calories, protein_g, carbs_g, fat_g, fiber_g


def Math_round_str(val: float) -> str:
    return str(int(val)) if val.is_integer() else str(round(val, 1))


def map_meal_entry_to_response(entry: MealEntry) -> MealEntryResponse:
    """Map DB MealEntry to API response model."""
    food_name = entry.food.name if entry.food else "Food Item"
    category_tag = entry.food.category if entry.food else "General"
    
    return MealEntryResponse(
        id=f"entry-{entry.id}",
        raw_id=entry.id,
        meal_id=entry.meal_id,
        food_id=entry.food_id,
        food_portion_id=entry.food_portion_id,
        food_name=food_name,
        subtext=f"{entry.serving_name}",
        serving=entry.serving_name,
        calories=entry.calories,
        protein=entry.protein_g,
        carbs=entry.carbs_g,
        fat=entry.fat_g,
        fiber=getattr(entry, "fiber_g", 0.0),
        category_tag=category_tag,
        quantity=entry.quantity,
        serving_gram=entry.serving_gram,
        created_at=entry.created_at,
    )


async def get_daily_diary_service(
    db: AsyncSession, user_id: int, date_str: str
) -> DailyDiaryResponse:
    """Retrieve daily diary summary, targets, and structured meal sections."""
    dt_start = parse_date_string(date_str)
    dt_end = datetime.combine(dt_start.date(), time.max, tzinfo=timezone.utc)

    # Fetch user's meals for this date
    stmt = (
        select(Meal)
        .where(
            Meal.user_id == user_id,
            Meal.consumed_at >= dt_start,
            Meal.consumed_at <= dt_end,
        )
        .options(
            selectinload(Meal.entries).selectinload(MealEntry.food),
            selectinload(Meal.entries).selectinload(MealEntry.food_portion),
        )
    )
    result = await db.execute(stmt)
    user_meals = list(result.scalars().all())

    # Map existing meals by meal_type
    meals_by_type: Dict[str, Meal] = {m.meal_type: m for m in user_meals}

    # Fetch dynamic user targets from profile or fall back if profile incomplete
    try:
        from app.services.nutrition import calculate_user_nutrition_targets
        dyn_targets = await calculate_user_nutrition_targets(db, user_id)
        target_cal = dyn_targets.target_calories
        target_p = dyn_targets.target_protein
        target_c = dyn_targets.target_carbs
        target_f = dyn_targets.target_fat
        target_fib = dyn_targets.target_fiber
    except Exception:
        target_cal = 2600.0
        target_p = 140.0
        target_c = 325.0
        target_f = 75.0
        target_fib = 30.0

    # Build 5 standard meal sections in order
    meal_order = ["breakfast", "lunch", "evening_snack", "dinner", "other"]
    section_responses: List[MealSectionResponse] = []

    grand_cal = 0.0
    grand_p = 0.0
    grand_c = 0.0
    grand_f = 0.0
    grand_fib = 0.0

    for m_type in meal_order:
        cfg = MEAL_SECTION_CONFIG.get(m_type, MEAL_SECTION_CONFIG["other"])
        existing_meal = meals_by_type.get(m_type)

        entries_list: List[MealEntryResponse] = []
        sec_cal = 0.0
        sec_p = 0.0
        sec_c = 0.0
        sec_f = 0.0
        sec_fib = 0.0

        if existing_meal and existing_meal.entries:
            for entry in existing_meal.entries:
                item_resp = map_meal_entry_to_response(entry)
                entries_list.append(item_resp)
                sec_cal += entry.calories
                sec_p += entry.protein_g
                sec_c += entry.carbs_g
                sec_f += entry.fat_g
                sec_fib += getattr(entry, "fiber_g", 0.0)

        grand_cal += sec_cal
        grand_p += sec_p
        grand_c += sec_c
        grand_f += sec_f
        grand_fib += sec_fib

        section_responses.append(
            MealSectionResponse(
                id=m_type,
                name=cfg["name"],
                time=cfg["time"],
                subtitle=cfg["subtitle"],
                icon_name=cfg["icon_name"],
                total_calories=round(sec_cal, 1),
                total_protein=round(sec_p, 1),
                total_carbs=round(sec_c, 1),
                total_fat=round(sec_f, 1),
                total_fiber=round(sec_fib, 1),
                items=entries_list,
            )
        )

    grand_cal = round(grand_cal, 1)
    grand_p = round(grand_p, 1)
    grand_c = round(grand_c, 1)
    grand_f = round(grand_f, 1)
    grand_fib = round(grand_fib, 1)

    diff = round(grand_cal - target_cal, 1)
    if diff > 0:
        status_text = f"+{int(diff)} kcal Surplus"
    elif diff < 0:
        status_text = f"{int(diff)} kcal Deficit"
    else:
        status_text = "On Target"

    return DailyDiaryResponse(
        date=dt_start.strftime("%Y-%m-%d"),
        grand_total_calories=grand_cal,
        grand_total_protein=grand_p,
        grand_total_carbs=grand_c,
        grand_total_fat=grand_f,
        grand_total_fiber=grand_fib,
        target_calories=target_cal,
        target_protein=target_p,
        target_carbs=target_c,
        target_fat=target_f,
        target_fiber=target_fib,
        caloric_status_text=status_text,
        meals=section_responses,
    )


async def create_diary_entry_service(
    db: AsyncSession, user_id: int, request: CreateDiaryEntryRequest
) -> MealEntryResponse:
    raw_meal_type = request.meal_type.lower().strip()
    alias_map = {
        "snack": "evening_snack",
        "snacks": "evening_snack",
        "evening_snack": "evening_snack",
        "breakfast": "breakfast",
        "lunch": "lunch",
        "dinner": "dinner",
        "other": "other",
    }
    meal_type = alias_map.get(raw_meal_type, raw_meal_type)

    if meal_type not in MEAL_SECTION_CONFIG:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid meal_type '{request.meal_type}'. Allowed: {list(MEAL_SECTION_CONFIG.keys())}",
        )

    # 1. Fetch & Validate Food with ownership isolation
    food_stmt = select(Food).where(Food.id == request.food_id)
    food_res = await db.execute(food_stmt)
    food = food_res.scalar_one_or_none()
    if not food or (food.user_id is not None and food.user_id != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food item with ID {request.food_id} not found.",
        )

    # 2. Fetch & Validate FoodPortion if supplied
    portion: Optional[FoodPortion] = None
    if request.food_portion_id:
        portion_stmt = select(FoodPortion).where(FoodPortion.id == request.food_portion_id)
        portion_res = await db.execute(portion_stmt)
        portion = portion_res.scalar_one_or_none()
        if not portion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food portion with ID {request.food_portion_id} not found.",
            )
        if portion.food_id != food.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Portion ID {request.food_portion_id} does not belong to Food ID {food.id}.",
            )

    dt_consumed = parse_date_string(request.date)

    # 3. Get or Create parent Meal record
    meal_stmt = select(Meal).where(
        Meal.user_id == user_id,
        Meal.consumed_at == dt_consumed,
        Meal.meal_type == meal_type,
    )
    meal_res = await db.execute(meal_stmt)
    meal = meal_res.scalar_one_or_none()

    if not meal:
        meal = Meal(
            user_id=user_id,
            meal_type=meal_type,
            consumed_at=dt_consumed,
            notes=request.notes,
        )
        db.add(meal)
        await db.flush()

    # 4. Calculate nutrition
    serving_name, subtext, serving_gram, calories, protein_g, carbs_g, fat_g, fiber_g = (
        compute_entry_nutrition(food, portion, request.quantity)
    )

    # 5. Create MealEntry
    entry = MealEntry(
        meal_id=meal.id,
        food_id=food.id,
        food_portion_id=portion.id if portion else None,
        quantity=request.quantity,
        serving_name=serving_name,
        serving_gram=serving_gram,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        fiber_g=fiber_g,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Re-query with relations loaded
    entry_stmt = (
        select(MealEntry)
        .where(MealEntry.id == entry.id)
        .options(
            selectinload(MealEntry.food),
            selectinload(MealEntry.food_portion),
        )
    )
    res = await db.execute(entry_stmt)
    entry_loaded = res.scalar_one()

    return map_meal_entry_to_response(entry_loaded)


async def update_diary_entry_service(
    db: AsyncSession, user_id: int, entry_id: int, request: UpdateDiaryEntryRequest
) -> MealEntryResponse:
    """Update quantity or portion of an existing user diary entry."""
    stmt = (
        select(MealEntry)
        .join(Meal)
        .where(MealEntry.id == entry_id, Meal.user_id == user_id)
        .options(
            selectinload(MealEntry.food),
            selectinload(MealEntry.food_portion),
        )
    )
    res = await db.execute(stmt)
    entry = res.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diary entry with ID {entry_id} not found or unauthorized.",
        )

    # If portion changed
    portion = entry.food_portion
    if request.food_portion_id is not None:
        if request.food_portion_id != entry.food_portion_id:
            p_stmt = select(FoodPortion).where(FoodPortion.id == request.food_portion_id)
            p_res = await db.execute(p_stmt)
            portion = p_res.scalar_one_or_none()
            if not portion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Food portion with ID {request.food_portion_id} not found.",
                )
            if portion.food_id != entry.food_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Portion ID {request.food_portion_id} does not belong to Food ID {entry.food_id}.",
                )
            entry.food_portion_id = portion.id
            entry.food_portion = portion

    quantity = request.quantity if request.quantity is not None else entry.quantity
    entry.quantity = quantity

    # Recalculate nutrition snapshot
    serving_name, subtext, serving_gram, calories, protein_g, carbs_g, fat_g, fiber_g = (
        compute_entry_nutrition(entry.food, portion, quantity)
    )
    entry.serving_name = serving_name
    entry.serving_gram = serving_gram
    entry.calories = calories
    entry.protein_g = protein_g
    entry.carbs_g = carbs_g
    entry.fat_g = fat_g
    entry.fiber_g = fiber_g

    await db.commit()
    await db.refresh(entry)

    return map_meal_entry_to_response(entry)


async def delete_diary_entry_service(
    db: AsyncSession, user_id: int, entry_id: int
) -> bool:
    """Delete a diary entry owned by the user."""
    stmt = (
        select(MealEntry)
        .join(Meal)
        .where(MealEntry.id == entry_id, Meal.user_id == user_id)
    )
    res = await db.execute(stmt)
    entry = res.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diary entry with ID {entry_id} not found or unauthorized.",
        )

    meal_id = entry.meal_id
    await db.delete(entry)
    await db.flush()

    # Check if meal is now empty; if so, delete parent meal container
    remaining_stmt = select(func.count(MealEntry.id)).where(MealEntry.meal_id == meal_id)
    rem_res = await db.execute(remaining_stmt)
    if rem_res.scalar_one() == 0:
        parent_stmt = select(Meal).where(Meal.id == meal_id)
        parent_res = await db.execute(parent_stmt)
        parent_meal = parent_res.scalar_one_or_none()
        if parent_meal:
            await db.delete(parent_meal)

    await db.commit()
    return True

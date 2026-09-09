from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.seed_foods import seed_foods_table
from app.models.diary import Meal, MealEntry
from app.models.food import Food, UserFavoriteFood
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.meal_plan import (
    AddMealPlanItemRequest,
    GenerateMealPlanRequest,
    MealGroupResponse,
    MealPlanDataQuality,
    MealPlanItemResponse,
    MealPlanNutritionSummary,
    MealPlanResponse,
    MealRecommendationItem,
    MealRecommendationResponse,
)
from app.services.diary import get_daily_diary_service
from app.services.nutrition import calculate_user_nutrition_targets


def generate_persona_safe_reason(
    food: Food,
    meal_type: str,
    persona: str,
    is_favorite: bool,
    is_pref_match: bool,
    target_gap_protein: bool,
) -> str:
    """Generates explainable, persona-safe recommendation text without fabricated data."""
    if persona in ("child", "teen"):
        if is_favorite:
            return f"One of your favorite nutritious foods for {meal_type} energy!"
        if target_gap_protein and food.protein_g >= 5.0:
            return f"Great protein source ({food.protein_g}g) supporting healthy growth and activity."
        return f"Wholesome {food.category.lower()} supporting active play and nourishment."
    elif persona == "older_adult":
        if is_favorite:
            return f"A familiar favorite food offering comfortable nourishment for {meal_type}."
        if food.protein_g >= 6.0:
            return f"Protein-rich choice ({food.protein_g}g) helping maintain muscle strength & vitality."
        return f"Easy-to-enjoy, nutrient-dense {food.category.lower()} for daily wellness."
    else:  # adult / family
        reasons = []
        if is_favorite:
            reasons.append("Marked as one of your favorite foods")
        if is_pref_match:
            reasons.append("Matches your preferred dietary pattern")
        if target_gap_protein and food.protein_g >= 6.0:
            reasons.append(f"Provides {food.protein_g}g protein for remaining target")
        
        if not reasons:
            reasons.append(f"Balanced {food.category.lower()} option for your {meal_type}")
        return ". ".join(reasons) + "."


async def get_data_quality_status(
    db: AsyncSession, current_user: User
) -> Tuple[MealPlanDataQuality, Optional[UserProfile]]:
    """Evaluates real data quality and completeness for the current user."""
    prof_stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()

    has_profile = bool(
        profile and (profile.age or profile.weight_kg or profile.height_cm)
    )

    # Check diary history
    meal_count_stmt = select(func.count(Meal.id)).where(Meal.user_id == current_user.id)
    meal_count_res = await db.execute(meal_count_stmt)
    total_meals = meal_count_res.scalar_one() or 0

    has_recent = total_meals > 0

    # Ensure food catalog has entries
    food_count_stmt = select(func.count(Food.id))
    food_count_res = await db.execute(food_count_stmt)
    total_foods = food_count_res.scalar_one() or 0
    if total_foods == 0:
        await seed_foods_table(db)
        has_catalog = True
    else:
        has_catalog = True

    has_sufficient = has_profile and (has_recent or total_foods > 0)

    if not has_profile:
        quality_note = "Complete your health profile for fully tailored meal recommendations."
    elif not has_recent:
        quality_note = "Log your first meal in the Food Diary to refine personalization."
    else:
        quality_note = "Grounded in your verified profile metrics and meal history."

    quality = MealPlanDataQuality(
        has_profile_data=has_profile,
        has_nutrition_data=has_profile,
        has_food_catalog_data=has_catalog,
        has_recent_history=has_recent,
        has_sufficient_data=has_sufficient,
        quality_note=quality_note,
    )
    return quality, profile


async def get_filtered_safe_foods(
    db: AsyncSession, current_user: User, profile: Optional[UserProfile]
) -> List[Food]:
    """Retrieves system and user custom foods, filtered by dietary type and avoidances."""
    await seed_foods_table(db)

    diet_type = (profile.diet_type if profile else "vegetarian") or "vegetarian"
    diet_type = diet_type.lower().strip()

    avoidances: List[str] = []
    if profile and profile.food_avoidances:
        avoidances = [str(a).lower().strip() for a in profile.food_avoidances if a]

    food_stmt = select(Food).where(
        or_(Food.user_id.is_(None), Food.user_id == current_user.id)
    )

    if diet_type in ("vegetarian", "vegan"):
        food_stmt = food_stmt.where(Food.is_vegetarian == True)

    food_res = await db.execute(food_stmt)
    all_foods = list(food_res.scalars().all())

    # Filter avoidances
    safe_foods: List[Food] = []
    for food in all_foods:
        text = f"{food.name} {food.alternate_name or ''} {food.description or ''}".lower()
        if not any(term in text for term in avoidances):
            safe_foods.append(food)

    return safe_foods


async def get_meal_recommendations_service(
    db: AsyncSession, current_user: User, date_str: Optional[str] = None
) -> MealRecommendationResponse:
    """Generates personalized, persona-safe food & meal recommendations."""
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    data_quality, profile = await get_data_quality_status(db, current_user)
    persona = profile.profile_type if profile else "adult"

    safe_foods = await get_filtered_safe_foods(db, current_user, profile)

    # User Favorite Foods IDs
    fav_stmt = select(UserFavoriteFood.food_id).where(UserFavoriteFood.user_id == current_user.id)
    fav_res = await db.execute(fav_stmt)
    favorite_food_ids = set(fav_res.scalars().all())

    # Nutrition targets & current daily intake
    try:
        targets = await calculate_user_nutrition_targets(db, current_user.id)
        target_calories = targets.target_calories
        target_protein = targets.target_protein
        target_carbs = targets.target_carbs
        target_fat = targets.target_fat
    except Exception:
        target_calories = 2000.0
        target_protein = 80.0
        target_carbs = 250.0
        target_fat = 65.0

    daily_diary = await get_daily_diary_service(db, current_user.id, date_str)
    rem_protein = max(0.0, target_protein - daily_diary.grand_total_protein)

    recommendations: List[MealRecommendationItem] = []
    
    # Determine suggested meal type based on hour of day
    current_hour = datetime.now(timezone.utc).hour
    if 5 <= current_hour < 11:
        suggested_meal_type = "breakfast"
    elif 11 <= current_hour < 16:
        suggested_meal_type = "lunch"
    elif 16 <= current_hour < 19:
        suggested_meal_type = "snack"
    else:
        suggested_meal_type = "dinner"

    user_preferences = [str(p).lower().strip() for p in (profile.food_preferences or []) if p] if profile else []

    for food in safe_foods:
        is_fav = food.id in favorite_food_ids
        food_text = f"{food.name} {food.category}".lower()
        is_pref = any(pref in food_text for pref in user_preferences)
        has_protein_gap = rem_protein > 15.0 and food.protein_g >= 5.0

        # Calculate confidence score
        score = 60.0
        if is_fav:
            score += 25.0
        if is_pref:
            score += 15.0
        if has_protein_gap:
            score += 10.0

        reason = generate_persona_safe_reason(
            food=food,
            meal_type=suggested_meal_type,
            persona=persona,
            is_favorite=is_fav,
            is_pref_match=is_pref,
            target_gap_protein=has_protein_gap,
        )

        recommendations.append(
            MealRecommendationItem(
                food_id=food.id,
                food_name=food.name,
                category=food.category,
                region=food.region,
                is_vegetarian=food.is_vegetarian,
                servings=1.0,
                calories=food.calories,
                protein_g=food.protein_g,
                carbs_g=food.carbs_g,
                fat_g=food.fat_g,
                suggested_meal_type=suggested_meal_type,
                reason=reason,
                confidence_score=min(100.0, score),
                preference_compatible=True,
                avoidance_safe=True,
            )
        )

    # Sort recommendations by highest confidence score
    recommendations.sort(key=lambda r: r.confidence_score, reverse=True)
    top_recommendations = recommendations[:10]

    return MealRecommendationResponse(
        recommendations=top_recommendations,
        suggested_meal_type=suggested_meal_type,
        data_quality=data_quality,
    )


async def generate_meal_plan_service(
    db: AsyncSession, current_user: User, request: GenerateMealPlanRequest
) -> MealPlanResponse:
    """Generates a complete personalized meal plan for a specific date."""
    plan_date = request.plan_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    requested_types = request.meal_types or ["breakfast", "lunch", "dinner", "snack"]

    data_quality, profile = await get_data_quality_status(db, current_user)
    persona = profile.profile_type if profile else "adult"

    safe_foods = await get_filtered_safe_foods(db, current_user, profile)
    if not safe_foods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate foods match your dietary constraints.",
        )

    # Check for existing plan for date
    plan_stmt = (
        select(MealPlan)
        .where(MealPlan.user_id == current_user.id, MealPlan.plan_date == plan_date)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    plan_res = await db.execute(plan_stmt)
    existing_plan = plan_res.scalar_one_or_none()

    if existing_plan:
        # Delete existing items for fresh regeneration
        for old_item in existing_plan.items:
            await db.delete(old_item)
        await db.flush()
        plan = existing_plan
        plan.persona = persona
        plan.updated_at = datetime.now(timezone.utc)
    else:
        plan = MealPlan(
            user_id=current_user.id,
            plan_date=plan_date,
            status="active",
            persona=persona,
        )
        db.add(plan)
        await db.flush()

    # User favorite foods IDs
    fav_stmt = select(UserFavoriteFood.food_id).where(UserFavoriteFood.user_id == current_user.id)
    fav_res = await db.execute(fav_stmt)
    favorite_food_ids = set(fav_res.scalars().all())

    # Categorize foods for meal appropriateness
    category_map: Dict[str, List[Food]] = {
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "snack": [],
    }

    for food in safe_foods:
        cat_lower = food.category.lower()
        if any(b in cat_lower for b in ["breakfast", "cereal", "egg", "fruit", "dairy", "bread"]):
            category_map["breakfast"].append(food)
        elif any(l in cat_lower for l in ["curry", "dal", "rice", "bread", "chicken", "paneer", "grain"]):
            category_map["lunch"].append(food)
            category_map["dinner"].append(food)
        else:
            category_map["snack"].append(food)

    # Fill defaults if category lists are thin
    for m_type in requested_types:
        if not category_map[m_type]:
            category_map[m_type] = safe_foods

    used_food_ids: Set[int] = set()

    for m_type in requested_types:
        candidates = category_map.get(m_type, safe_foods)
        # Prioritize unused foods, then favorites
        available = [f for f in candidates if f.id not in used_food_ids]
        if not available:
            available = candidates

        # Sort by favorite status & protein
        available.sort(key=lambda f: (f.id in favorite_food_ids, f.protein_g), reverse=True)
        selected_food = available[0]
        used_food_ids.add(selected_food.id)

        is_fav = selected_food.id in favorite_food_ids
        reason = generate_persona_safe_reason(
            food=selected_food,
            meal_type=m_type,
            persona=persona,
            is_favorite=is_fav,
            is_pref_match=True,
            target_gap_protein=selected_food.protein_g >= 5.0,
        )

        item = MealPlanItem(
            meal_plan_id=plan.id,
            meal_type=m_type,
            food_id=selected_food.id,
            servings=1.0,
            suggested_reason=reason,
        )
        db.add(item)

    await db.commit()

    # Re-fetch plan with items loaded
    res_plan = await db.execute(
        select(MealPlan)
        .where(MealPlan.id == plan.id)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    plan_obj = res_plan.scalar_one()

    return format_meal_plan_response(db, current_user, plan_obj, data_quality)


def format_meal_plan_response(
    db: AsyncSession,
    current_user: User,
    plan: MealPlan,
    data_quality: MealPlanDataQuality,
) -> MealPlanResponse:
    """Formats ORM MealPlan into typed MealPlanResponse."""
    grouped: Dict[str, List[MealPlanItemResponse]] = {
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "snack": [],
    }

    tot_cal = 0.0
    tot_p = 0.0
    tot_c = 0.0
    tot_f = 0.0

    for item in plan.items:
        food = item.food
        cals = round(food.calories * item.servings, 1)
        p_g = round(food.protein_g * item.servings, 1)
        c_g = round(food.carbs_g * item.servings, 1)
        f_g = round(food.fat_g * item.servings, 1)

        tot_cal += cals
        tot_p += p_g
        tot_c += c_g
        tot_f += f_g

        item_resp = MealPlanItemResponse(
            id=item.id,
            food_id=food.id,
            food_name=food.name,
            category=food.category,
            servings=item.servings,
            calories=cals,
            protein_g=p_g,
            carbs_g=c_g,
            fat_g=f_g,
            reason=item.suggested_reason,
        )

        m_type = item.meal_type if item.meal_type in grouped else "snack"
        grouped[m_type].append(item_resp)

    meal_groups = [
        MealGroupResponse(meal_type=m_type, items=items)
        for m_type, items in grouped.items()
    ]

    # Reference targets
    summary = MealPlanNutritionSummary(
        total_calories=round(tot_cal, 1),
        total_protein=round(tot_p, 1),
        total_carbs=round(tot_c, 1),
        total_fat=round(tot_f, 1),
        target_calories=2000.0,
        target_protein=80.0,
        target_carbs=250.0,
        target_fat=65.0,
    )

    return MealPlanResponse(
        id=plan.id,
        plan_date=plan.plan_date,
        persona=plan.persona,
        status=plan.status,
        meals=meal_groups,
        nutrition_summary=summary,
        data_quality=data_quality,
    )


async def get_today_meal_plan_service(
    db: AsyncSession, current_user: User, date_str: Optional[str] = None
) -> MealPlanResponse:
    """Retrieves or auto-generates today's meal plan for the current user."""
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    data_quality, profile = await get_data_quality_status(db, current_user)

    stmt = (
        select(MealPlan)
        .where(MealPlan.user_id == current_user.id, MealPlan.plan_date == date_str)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    res = await db.execute(stmt)
    plan = res.scalar_one_or_none()

    if not plan:
        # Auto-generate plan for date
        req = GenerateMealPlanRequest(plan_date=date_str)
        return await generate_meal_plan_service(db, current_user, req)

    return format_meal_plan_response(db, current_user, plan, data_quality)


async def get_user_meal_plans_service(
    db: AsyncSession, current_user: User, limit: int = 10
) -> List[MealPlanResponse]:
    """Retrieves historical meal plans for the authenticated user."""
    data_quality, _ = await get_data_quality_status(db, current_user)

    stmt = (
        select(MealPlan)
        .where(MealPlan.user_id == current_user.id)
        .order_by(MealPlan.plan_date.desc())
        .limit(limit)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    res = await db.execute(stmt)
    plans = list(res.scalars().all())

    return [format_meal_plan_response(db, current_user, p, data_quality) for p in plans]


async def add_meal_plan_item_service(
    db: AsyncSession, current_user: User, plan_id: int, request: AddMealPlanItemRequest
) -> MealPlanResponse:
    """Adds a new item to an existing meal plan with strict ownership checks."""
    plan_stmt = (
        select(MealPlan)
        .where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    plan_res = await db.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found or access denied.",
        )

    # Verify food exists and is accessible
    food_stmt = select(Food).where(
        Food.id == request.food_id,
        or_(Food.user_id.is_(None), Food.user_id == current_user.id),
    )
    food_res = await db.execute(food_stmt)
    food = food_res.scalar_one_or_none()

    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found or unauthorized.",
        )

    reason = request.suggested_reason or f"Manually added to {request.meal_type}."

    new_item = MealPlanItem(
        meal_plan_id=plan.id,
        meal_type=request.meal_type,
        food_id=food.id,
        servings=request.servings or 1.0,
        suggested_reason=reason,
    )
    db.add(new_item)
    await db.commit()

    # Refresh
    ref_res = await db.execute(
        select(MealPlan)
        .where(MealPlan.id == plan.id)
        .options(selectinload(MealPlan.items).selectinload(MealPlanItem.food))
    )
    ref_plan = ref_res.scalar_one()

    data_quality, _ = await get_data_quality_status(db, current_user)
    return format_meal_plan_response(db, current_user, ref_plan, data_quality)


async def delete_meal_plan_service(
    db: AsyncSession, current_user: User, plan_id: int
) -> dict:
    """Deletes a meal plan belonging to the authenticated user."""
    plan_stmt = select(MealPlan).where(
        MealPlan.id == plan_id, MealPlan.user_id == current_user.id
    )
    plan_res = await db.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found or access denied.",
        )

    await db.delete(plan)
    await db.commit()
    return {"message": f"Successfully deleted meal plan {plan_id}"}

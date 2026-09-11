from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.diary import Meal, MealEntry
from app.models.food import Food, FoodPortion, UserFavoriteFood
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.notification import HealthNotification
from app.models.profile import UserProfile
from app.models.recipe import Recipe, RecipeIngredient
from app.models.report import ClinicalReport
from app.models.session import UserSession
from app.models.user import User
from app.models.weight import WeightLog
from app.schemas.account import (
    AccountSummaryResponse,
    HealthDataExportResponse,
    RecordCountsSchema,
    UserExportSchema,
)


def _serialize_datetime(val: Optional[datetime]) -> Optional[str]:
    return val.isoformat() if val else None


async def get_account_summary(
    db: AsyncSession, current_user: User
) -> AccountSummaryResponse:
    """Fetch live record counts and account metadata for the authenticated user."""
    user_id = current_user.id

    # 1. Query counts across health data tables
    meals_count = (
        await db.scalar(select(func.count(Meal.id)).where(Meal.user_id == user_id))
    ) or 0

    custom_foods_count = (
        await db.scalar(select(func.count(Food.id)).where(Food.user_id == user_id))
    ) or 0

    favorites_count = (
        await db.scalar(
            select(func.count(UserFavoriteFood.id)).where(
                UserFavoriteFood.user_id == user_id
            )
        )
    ) or 0

    weight_count = (
        await db.scalar(
            select(func.count(WeightLog.id)).where(WeightLog.user_id == user_id)
        )
    ) or 0

    water_count = (
        await db.scalar(
            select(func.count(WaterLog.id)).where(WaterLog.user_id == user_id)
        )
    ) or 0

    activity_count = (
        await db.scalar(
            select(func.count(ActivityLog.id)).where(ActivityLog.user_id == user_id)
        )
    ) or 0

    goals_count = (
        await db.scalar(
            select(func.count(HealthGoal.id)).where(HealthGoal.user_id == user_id)
        )
    ) or 0

    meal_plans_count = (
        await db.scalar(
            select(func.count(MealPlan.id)).where(MealPlan.user_id == user_id)
        )
    ) or 0

    recipes_count = (
        await db.scalar(
            select(func.count(Recipe.id)).where(Recipe.user_id == user_id)
        )
    ) or 0

    reports_count = (
        await db.scalar(
            select(func.count(ClinicalReport.id)).where(
                ClinicalReport.user_id == user_id
            )
        )
    ) or 0

    # 2. Fetch Profile Type
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    profile_res = await db.execute(profile_stmt)
    user_profile = profile_res.scalar_one_or_none()
    profile_type = user_profile.profile_type if user_profile else "adult"

    # 3. Determine Last Activity Timestamp
    last_meal = (
        await db.scalar(
            select(func.max(Meal.consumed_at)).where(Meal.user_id == user_id)
        )
    )
    last_weight = (
        await db.scalar(
            select(func.max(WeightLog.date)).where(WeightLog.user_id == user_id)
        )
    )
    last_water = (
        await db.scalar(
            select(func.max(WaterLog.date)).where(WaterLog.user_id == user_id)
        )
    )

    timestamps = [t for t in [last_meal, last_weight, last_water, current_user.created_at] if t is not None]
    last_activity_at = max(timestamps) if timestamps else current_user.created_at

    return AccountSummaryResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at,
        auth_provider=current_user.auth_provider,
        profile_type=profile_type,
        record_counts=RecordCountsSchema(
            meals=meals_count,
            custom_foods=custom_foods_count,
            favorite_foods=favorites_count,
            weight_logs=weight_count,
            hydration_logs=water_count,
            activity_logs=activity_count,
            health_goals=goals_count,
            meal_plans=meal_plans_count,
            recipes=recipes_count,
            clinical_reports=reports_count,
        ),
        last_activity_at=last_activity_at,
    )


async def export_account_data(
    db: AsyncSession, current_user: User
) -> HealthDataExportResponse:
    """Generate a structured, sanitized export of all health records for current_user."""
    user_id = current_user.id

    # 1. User Identity (Sanitized — NO passwords/secrets)
    user_export = UserExportSchema(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        auth_provider=current_user.auth_provider,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )

    # 2. Profile
    profile_res = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    prof = profile_res.scalar_one_or_none()
    profile_data = None
    if prof:
        profile_data = {
            "profile_type": prof.profile_type,
            "date_of_birth": prof.date_of_birth,
            "country": prof.country,
            "region": prof.region,
            "preferred_language": prof.preferred_language,
            "age": prof.age,
            "biological_sex": prof.biological_sex,
            "diet_type": prof.diet_type,
            "food_preferences": prof.food_preferences,
            "food_avoidances": prof.food_avoidances,
            "meal_frequency": prof.meal_frequency,
            "meal_timings": prof.meal_timings,
            "health_conditions": prof.health_conditions,
            "unit_system": prof.unit_system,
            "height_cm": prof.height_cm,
            "weight_kg": prof.weight_kg,
            "target_mass_kg": prof.target_mass_kg,
            "primary_goal": prof.primary_goal,
            "activity_level": prof.activity_level,
            "onboarding_completed": prof.onboarding_completed,
            "created_at": _serialize_datetime(prof.created_at),
            "updated_at": _serialize_datetime(prof.updated_at),
        }

    # 3. Meals & Entries
    meals_res = await db.execute(
        select(Meal).where(Meal.user_id == user_id).order_by(Meal.consumed_at.desc())
    )
    meals_list = meals_res.scalars().all()
    exported_meals = []
    for m in meals_list:
        entries_data = []
        for e in m.entries:
            entries_data.append(
                {
                    "food_id": e.food_id,
                    "food_name": e.food.name if e.food else None,
                    "quantity": e.quantity,
                    "serving_name": e.serving_name,
                    "serving_gram": e.serving_gram,
                    "calories": e.calories,
                    "protein_g": e.protein_g,
                    "carbs_g": e.carbs_g,
                    "fat_g": e.fat_g,
                    "fiber_g": e.fiber_g,
                }
            )
        exported_meals.append(
            {
                "id": m.id,
                "meal_type": m.meal_type,
                "consumed_at": _serialize_datetime(m.consumed_at),
                "notes": m.notes,
                "entries": entries_data,
            }
        )

    # 4. Custom Foods
    custom_foods_res = await db.execute(
        select(Food).where(Food.user_id == user_id)
    )
    custom_foods = custom_foods_res.scalars().all()
    exported_custom_foods = []
    for f in custom_foods:
        portions_data = [
            {"portion_name": p.portion_name, "gram_weight": p.gram_weight, "is_default": p.is_default}
            for p in f.portions
        ]
        exported_custom_foods.append(
            {
                "id": f.id,
                "name": f.name,
                "category": f.category,
                "region": f.region,
                "is_vegetarian": f.is_vegetarian,
                "serving_size_name": f.serving_size_name,
                "serving_size_g": f.serving_size_g,
                "calories": f.calories,
                "protein_g": f.protein_g,
                "carbs_g": f.carbs_g,
                "fat_g": f.fat_g,
                "fiber_g": f.fiber_g,
                "portions": portions_data,
            }
        )

    # 5. Favorite Foods
    fav_res = await db.execute(
        select(UserFavoriteFood).where(UserFavoriteFood.user_id == user_id)
    )
    favorites = fav_res.scalars().all()
    exported_favorites = []
    for fav in favorites:
        food_obj = await db.scalar(select(Food).where(Food.id == fav.food_id))
        exported_favorites.append(
            {
                "food_id": fav.food_id,
                "food_name": food_obj.name if food_obj else None,
                "added_at": _serialize_datetime(fav.created_at),
            }
        )

    # 6. Recipes
    recipes_res = await db.execute(
        select(Recipe).where(Recipe.user_id == user_id)
    )
    recipes = recipes_res.scalars().all()
    exported_recipes = []
    for r in recipes:
        ingredients_data = [
            {
                "name": ing.name,
                "batch_measure": ing.batch_measure,
                "calories": ing.calories,
                "protein_g": ing.protein_g,
                "carbs_g": ing.carbs_g,
                "fat_g": ing.fat_g,
            }
            for p_ing in [r.ingredients]
            for ing in p_ing
        ]
        exported_recipes.append(
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "servings": r.servings,
                "prep_time_minutes": r.prep_time_minutes,
                "ingredients": ingredients_data,
                "created_at": _serialize_datetime(r.created_at),
            }
        )

    # 7. Weight Logs
    weight_res = await db.execute(
        select(WeightLog).where(WeightLog.user_id == user_id).order_by(WeightLog.date.desc())
    )
    exported_weight = [
        {"date": _serialize_datetime(w.date), "weight_kg": w.weight_kg, "note": w.note}
        for w in weight_res.scalars().all()
    ]

    # 8. Hydration Logs
    water_res = await db.execute(
        select(WaterLog).where(WaterLog.user_id == user_id).order_by(WaterLog.date.desc())
    )
    exported_water = [
        {"date": _serialize_datetime(w.date), "amount_ml": w.amount_ml}
        for w in water_res.scalars().all()
    ]

    # 9. Activity Logs
    act_res = await db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user_id).order_by(ActivityLog.date.desc())
    )
    exported_activity = [
        {
            "date": _serialize_datetime(a.date),
            "step_count": a.step_count,
            "active_minutes": a.active_minutes,
            "calories_burned": a.calories_burned,
            "activity_type": a.activity_type,
        }
        for a in act_res.scalars().all()
    ]

    # 10. Health Goals
    goals_res = await db.execute(
        select(HealthGoal).where(HealthGoal.user_id == user_id)
    )
    exported_goals = [
        {
            "id": g.id,
            "title": g.title,
            "category": g.category,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "unit": g.unit,
            "status": g.status,
            "target_date": g.target_date,
        }
        for g in goals_res.scalars().all()
    ]

    # 11. Meal Plans
    mp_res = await db.execute(
        select(MealPlan).where(MealPlan.user_id == user_id)
    )
    exported_meal_plans = []
    for mp in mp_res.scalars().all():
        items_data = [
            {
                "meal_type": item.meal_type,
                "food_id": item.food_id,
                "food_name": item.food.name if item.food else None,
                "servings": item.servings,
                "suggested_reason": item.suggested_reason,
            }
            for item in mp.items
        ]
        exported_meal_plans.append(
            {
                "id": mp.id,
                "plan_date": mp.plan_date,
                "status": mp.status,
                "persona": mp.persona,
                "items": items_data,
            }
        )

    # 12. Clinical Reports
    reports_res = await db.execute(
        select(ClinicalReport).where(ClinicalReport.user_id == user_id)
    )
    exported_reports = [
        {
            "document_id": r.document_id,
            "report_type": r.report_type,
            "avg_7day_calories": r.avg_7day_calories,
            "caloric_adherence_pct": r.caloric_adherence_pct,
            "protein_velocity_g": r.protein_velocity_g,
            "protein_pct": r.protein_pct,
            "created_at": _serialize_datetime(r.created_at),
        }
        for r in reports_res.scalars().all()
    ]

    # 13. Notifications
    notif_res = await db.execute(
        select(HealthNotification).where(HealthNotification.user_id == user_id)
    )
    exported_notifications = [
        {
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": _serialize_datetime(n.created_at),
        }
        for n in notif_res.scalars().all()
    ]

    return HealthDataExportResponse(
        generated_at=datetime.now(timezone.utc),
        user=user_export,
        profile=profile_data,
        meals=exported_meals,
        custom_foods=exported_custom_foods,
        favorite_foods=exported_favorites,
        recipes=exported_recipes,
        weight_logs=exported_weight,
        hydration_logs=exported_water,
        activity_logs=exported_activity,
        goals=exported_goals,
        meal_plans=exported_meal_plans,
        clinical_reports=exported_reports,
        notifications=exported_notifications,
    )


async def delete_user_account(db: AsyncSession, current_user: User) -> None:
    """Safely delete all personal health records belonging to current_user and purge account.

    Preserves global system foods (user_id is None) and does not affect other users.
    """
    user_id = current_user.id

    # 1. Delete MealPlans (cascades to MealPlanItem)
    await db.execute(delete(MealPlan).where(MealPlan.user_id == user_id))

    # 2. Delete Meals (cascades to MealEntry, removing RESTRICT FK on custom foods)
    await db.execute(delete(Meal).where(Meal.user_id == user_id))

    # 3. Delete Favorites
    await db.execute(delete(UserFavoriteFood).where(UserFavoriteFood.user_id == user_id))

    # 4. Delete Custom Foods (user_id = current_user.id)
    await db.execute(delete(Food).where(Food.user_id == user_id))

    # 5. Delete Recipes (cascades to RecipeIngredient)
    await db.execute(delete(Recipe).where(Recipe.user_id == user_id))

    # 6. Delete Health Logs & Modules
    await db.execute(delete(WeightLog).where(WeightLog.user_id == user_id))
    await db.execute(delete(WaterLog).where(WaterLog.user_id == user_id))
    await db.execute(delete(ActivityLog).where(ActivityLog.user_id == user_id))
    await db.execute(delete(HealthGoal).where(HealthGoal.user_id == user_id))
    await db.execute(delete(ClinicalReport).where(ClinicalReport.user_id == user_id))
    await db.execute(delete(HealthNotification).where(HealthNotification.user_id == user_id))
    await db.execute(delete(UserProfile).where(UserProfile.user_id == user_id))
    await db.execute(delete(UserSession).where(UserSession.user_id == user_id))

    # 7. Delete User Record
    await db.delete(current_user)
    await db.commit()

from typing import Dict, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import UserProfile
from app.schemas.nutrition import (
    NutritionSummaryResponse,
    NutritionTargetsResponse,
    MacroItemSummary,
    StatelessCalculateRequest,
)
from app.services.diary import get_daily_diary_service

PAL_MULTIPLIERS: Dict[str, float] = {
    "Sedentary": 1.20,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extremely Active": 1.90,
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, biological_sex: str) -> float:
    """Calculates Basal Metabolic Rate via Mifflin-St Jeor equation."""
    sex_clean = (biological_sex or "female").lower().strip()
    if sex_clean == "male":
        return round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + 5.0, 1)
    elif sex_clean == "female":
        return round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 161.0, 1)
    else:
        # Unspecified / Non-binary midpoint (-78 offset)
        return round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 78.0, 1)


def get_pal_multiplier(activity_level: Optional[str]) -> float:
    """Returns physical activity level multiplier."""
    if not activity_level:
        return 1.55
    return PAL_MULTIPLIERS.get(activity_level.strip(), 1.55)


def calculate_goal_adjustment(primary_goal: Optional[str], progression_pace: Optional[str]) -> float:
    """Returns caloric surplus/deficit adjustment based on goal & pace."""
    goal = (primary_goal or "maintain").lower().strip()
    pace = (progression_pace or "gradual").lower().strip()

    if goal == "fat-loss":
        return -350.0 if pace == "gradual" else -500.0
    elif goal == "muscle":
        return 250.0 if pace == "gradual" else 400.0
    else:
        return 0.0


def calculate_macros_and_targets(
    bmr: float,
    pal: float,
    weight_kg: float,
    biological_sex: str,
    primary_goal: Optional[str],
    progression_pace: Optional[str],
) -> Tuple[float, float, float, float, float, float, float, float]:
    """
    Computes (tdee, target_calories, target_protein, target_carbs, target_fat, target_fiber, goal_adj, protein_ratio).
    """
    tdee = round(bmr * pal, 1)
    goal_adj = calculate_goal_adjustment(primary_goal, progression_pace)
    raw_target = tdee + goal_adj

    # Enforce physiological safety boundaries
    sex_clean = (biological_sex or "female").lower().strip()
    floor = 1200.0 if sex_clean == "female" else 1500.0
    target_calories = round(max(floor, min(4500.0, raw_target)), 1)

    # 1. Protein Target
    goal = (primary_goal or "maintain").lower().strip()
    if goal == "muscle":
        protein_ratio = 2.0
    elif goal == "fat-loss":
        protein_ratio = 1.8
    else:
        protein_ratio = 1.5

    target_protein = round(weight_kg * protein_ratio, 1)
    protein_kcal = target_protein * 4.0

    # 2. Fat Target (25% of calories, floor 40g)
    fat_kcal_raw = target_calories * 0.25
    target_fat = round(max(40.0, fat_kcal_raw / 9.0), 1)
    actual_fat_kcal = target_fat * 9.0

    # 3. Carbohydrate Target (Remaining calories)
    carb_kcal = max(0.0, target_calories - (protein_kcal + actual_fat_kcal))
    target_carbs = round(carb_kcal / 4.0, 1)

    # 4. Dietary Fiber Target (14g / 1000 kcal, floor 25g/30g)
    fiber_floor = 25.0 if sex_clean == "female" else 30.0
    target_fiber = round(max(fiber_floor, (target_calories / 1000.0) * 14.0), 1)

    return (
        tdee,
        target_calories,
        target_protein,
        target_carbs,
        target_fat,
        target_fiber,
        goal_adj,
        protein_ratio,
    )


async def calculate_user_nutrition_targets(
    db: AsyncSession, user_id: int
) -> NutritionTargetsResponse:
    """Fetch user profile and calculate personalized nutrition targets."""
    stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile or not profile.age or not profile.height_cm or not profile.weight_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete user profile. Please complete onboarding biometrics to compute nutrition targets.",
        )

    bmr = calculate_bmr(
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age=profile.age,
        biological_sex=profile.biological_sex or "female",
    )
    pal = get_pal_multiplier(profile.activity_level)

    (
        tdee,
        target_calories,
        target_protein,
        target_carbs,
        target_fat,
        target_fiber,
        goal_adj,
        protein_ratio,
    ) = calculate_macros_and_targets(
        bmr=bmr,
        pal=pal,
        weight_kg=profile.weight_kg,
        biological_sex=profile.biological_sex or "female",
        primary_goal=profile.primary_goal,
        progression_pace=profile.progression_pace,
    )

    return NutritionTargetsResponse(
        bmr=bmr,
        tdee=tdee,
        target_calories=target_calories,
        target_protein=target_protein,
        target_carbs=target_carbs,
        target_fat=target_fat,
        target_fiber=target_fiber,
        pal_multiplier=pal,
        goal_adjustment_calories=goal_adj,
        protein_g_per_kg=protein_ratio,
        methodology="Mifflin-St Jeor (1990) & ICMR 2024 Guidelines",
    )


def calculate_stateless_targets(request: StatelessCalculateRequest) -> NutritionTargetsResponse:
    """Calculates nutrition targets from arbitrary request payload."""
    bmr = calculate_bmr(
        weight_kg=request.weight_kg,
        height_cm=request.height_cm,
        age=request.age,
        biological_sex=request.biological_sex,
    )
    pal = get_pal_multiplier(request.activity_level)

    (
        tdee,
        target_calories,
        target_protein,
        target_carbs,
        target_fat,
        target_fiber,
        goal_adj,
        protein_ratio,
    ) = calculate_macros_and_targets(
        bmr=bmr,
        pal=pal,
        weight_kg=request.weight_kg,
        biological_sex=request.biological_sex,
        primary_goal=request.primary_goal,
        progression_pace=request.progression_pace,
    )

    return NutritionTargetsResponse(
        bmr=bmr,
        tdee=tdee,
        target_calories=target_calories,
        target_protein=target_protein,
        target_carbs=target_carbs,
        target_fat=target_fat,
        target_fiber=target_fiber,
        pal_multiplier=pal,
        goal_adjustment_calories=goal_adj,
        protein_g_per_kg=protein_ratio,
        methodology="Mifflin-St Jeor (1990) & ICMR 2024 Guidelines",
    )


async def get_daily_nutrition_summary(
    db: AsyncSession, user_id: int, date_str: str
) -> NutritionSummaryResponse:
    """Combines personalized targets with actual food diary intake for date."""
    targets = await calculate_user_nutrition_targets(db, user_id)
    diary = await get_daily_diary_service(db, user_id, date_str)

    consumed_cal = diary.grand_total_calories
    rem_cal = round(targets.target_calories - consumed_cal, 1)
    cal_adh = round((consumed_cal / targets.target_calories) * 100.0, 1) if targets.target_calories > 0 else 0.0

    def make_macro_summary(target: float, consumed: float) -> MacroItemSummary:
        rem = round(target - consumed, 1)
        adh = round((consumed / target) * 100.0, 1) if target > 0 else 0.0
        return MacroItemSummary(
            target=target,
            consumed=round(consumed, 1),
            remaining=rem,
            adherence_pct=adh,
        )

    return NutritionSummaryResponse(
        date=diary.date,
        target_calories=targets.target_calories,
        consumed_calories=consumed_cal,
        remaining_calories=rem_cal,
        caloric_adherence_pct=cal_adh,
        caloric_status_text=diary.caloric_status_text,
        protein=make_macro_summary(targets.target_protein, diary.grand_total_protein),
        carbs=make_macro_summary(targets.target_carbs, diary.grand_total_carbs),
        fat=make_macro_summary(targets.target_fat, diary.grand_total_fat),
        fiber=make_macro_summary(targets.target_fiber, diary.grand_total_fiber),
    )

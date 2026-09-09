from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import UserProfile
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.activity import ActivityLog
from app.models.diary import Meal, MealEntry
from app.models.food import Food
from app.schemas.goal import CoachingInsightResponse


async def generate_adaptive_coaching_insights(
    db: AsyncSession, user_id: int
) -> List[CoachingInsightResponse]:
    """Generates explainable, deterministic adaptive coaching insights based on real user data."""
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    days_7_ago_str = (now - timedelta(days=6)).strftime("%Y-%m-%d")

    # 1. Fetch User Profile & Persona
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    profile_type = profile.profile_type if profile else "adult"

    insights: List[CoachingInsightResponse] = []

    # 2. Check 7-Day Meal Diary Logging Consistency
    meal_days_res = await db.execute(
        select(func.count(distinct(func.date(Meal.consumed_at)))).where(
            Meal.user_id == user_id,
            func.date(Meal.consumed_at) >= days_7_ago_str,
            func.date(Meal.consumed_at) <= today_str,
        )
    )
    logged_days = meal_days_res.scalar() or 0

    if logged_days == 0:
        insights.append(
            CoachingInsightResponse(
                id="missing-diary-logs",
                category="consistency",
                priority="high",
                title="Start Your Daily Food Diary",
                message="Logging your meals regularly provides the clinical foundation for tracking nutrition, protein, and energy balance.",
                suggested_action="Log First Meal",
                suggested_route="/app/diary",
            )
        )
    elif logged_days >= 5:
        insights.append(
            CoachingInsightResponse(
                id="high-diary-consistency",
                category="consistency",
                priority="low",
                title="Strong Logging Consistency",
                message=f"Excellent routine! You've logged your food diary on {logged_days} of the past 7 days.",
                suggested_action="View Weekly Reports",
                suggested_route="/app/reports",
                metric_context={"logged_days": logged_days, "target_days": 7},
            )
        )
    else:
        insights.append(
            CoachingInsightResponse(
                id="moderate-diary-consistency",
                category="consistency",
                priority="medium",
                title="Build Daily Logging Habits",
                message=f"You've recorded meals on {logged_days} days this week. Logging daily helps unlock personalized nutrition trends.",
                suggested_action="Log Meal Today",
                suggested_route="/app/diary",
                metric_context={"logged_days": logged_days, "target_days": 7},
            )
        )

    # 3. Check Hydration Telemetry
    water_res = await db.execute(
        select(func.sum(WaterLog.amount_ml), func.count(distinct(func.date(WaterLog.date)))).where(
            WaterLog.user_id == user_id,
            func.date(WaterLog.date) >= days_7_ago_str,
            func.date(WaterLog.date) <= today_str,
        )
    )
    w_row = water_res.first()
    tot_ml = w_row[0] if w_row and w_row[0] is not None else 0
    water_days = w_row[1] if w_row and w_row[1] is not None else 0

    if not tot_ml or water_days == 0:
        insights.append(
            CoachingInsightResponse(
                id="hydration-missing",
                category="hydration",
                priority="high" if profile_type == "older_adult" else "medium",
                title="Hydration Tracking",
                message="Water intake is essential for physical vitality and cognitive focus. Start logging your daily water intake.",
                suggested_action="Log Water",
                suggested_route="/app/diary",
            )
        )
    else:
        avg_water = round(float(tot_ml) / float(water_days), 0)
        target_water = 2500.0 if profile_type != "child" else 1600.0
        if avg_water >= target_water * 0.8:
            insights.append(
                CoachingInsightResponse(
                    id="hydration-optimal",
                    category="hydration",
                    priority="low",
                    title="Optimal Hydration Level",
                    message=f"Averaging {int(avg_water)} mL of water daily across logged days. Keep up the healthy hydration habit!",
                    suggested_action="View Hydration Details",
                    suggested_route="/app/diary",
                    metric_context={"avg_ml": avg_water, "target_ml": target_water},
                )
            )
        else:
            insights.append(
                CoachingInsightResponse(
                    id="hydration-deficit",
                    category="hydration",
                    priority="medium",
                    title="Boost Daily Hydration",
                    message=f"Your average water intake ({int(avg_water)} mL/day) is below your target ({int(target_water)} mL/day).",
                    suggested_action="Add Glass of Water",
                    suggested_route="/app/diary",
                    metric_context={"avg_ml": avg_water, "target_ml": target_water},
                )
            )

    # 4. Persona-Specific Health Guidance
    if profile_type in ["child", "teen"]:
        insights.append(
            CoachingInsightResponse(
                id="persona-pediatric-growth",
                category="nutrition",
                priority="high",
                title="Nourishing Growth & Vitality",
                message="Active growth requires balanced proteins, complex carbohydrates, and essential micronutrients. Focus on wholesome meals and daily play!",
                suggested_action="Explore Smart Meal Plan",
                suggested_route="/app/meal-plan",
            )
        )
    elif profile_type == "older_adult":
        insights.append(
            CoachingInsightResponse(
                id="persona-older-adult-protein",
                category="nutrition",
                priority="high",
                title="Muscle Strength & Joint Health",
                message="Prioritize high-quality protein with each meal to support sarcopenia prevention, muscle maintenance, and physical independence.",
                suggested_action="View High-Protein Suggestions",
                suggested_route="/app/meal-plan",
            )
        )
    else:
        insights.append(
            CoachingInsightResponse(
                id="persona-adult-rda",
                category="nutrition",
                priority="medium",
                title="Balanced RDA Alignment",
                message="Aligning your daily intake with ICMR-NIN 2024 standards supports metabolic endurance and lean body composition.",
                suggested_action="Check RDA Breakdown",
                suggested_route="/app/nutrition",
            )
        )

    # 5. Sort Insights by Priority (high -> medium -> low) and return top 4
    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_insights = sorted(insights, key=lambda x: priority_order.get(x.priority, 3))
    return sorted_insights[:4]

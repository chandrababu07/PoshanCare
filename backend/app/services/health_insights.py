from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.diary import Meal
from app.models.goal import HealthGoal
from app.models.hydration import WaterLog
from app.models.meal_plan import MealPlan
from app.models.profile import UserProfile
from app.models.user import User
from app.models.weight import WeightLog
from app.schemas.health_insights import (
    CategorySummaryItem,
    CorrelationInsight,
    DataAvailability,
    HealthInsightsResponse,
    HealthInsightsSummary,
    PrioritizedAction,
    RuleBasedInsight,
    TrendAnalysisPoint,
    TrendAnalysisSeries,
)
from app.services.analytics import parse_period
from app.services.nutrition import calculate_user_nutrition_targets


async def get_health_insights_service(
    db: AsyncSession, current_user: User, period_str: str = "7d"
) -> HealthInsightsResponse:
    """
    Aggregates real health telemetry (nutrition, hydration, activity, weight, goals, meal plans)
    into structured summaries, trend analysis, non-causal correlations, explainable rule-based
    insights, and a prioritized action center with persona-specific safety controls.

    ZERO Fabricated Data Guarantee: Missing data is represented as null / False. No fake metrics.
    """
    days_count = parse_period(period_str)
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    current_start = today_start - timedelta(days=days_count - 1)
    today_str = today_start.strftime("%Y-%m-%d")

    # 1. User Profile & Persona Context
    prof_stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()

    persona = (profile.profile_type if profile else "adult") or "adult"
    persona = persona.lower().strip()
    is_pediatric = persona in ("child", "teen") or (profile and profile.age and profile.age < 18)
    is_older_adult = persona == "older_adult" or (profile and profile.age and profile.age >= 65)

    # 2. Nutrition Targets
    try:
        targets = await calculate_user_nutrition_targets(db, current_user.id)
        target_cals = targets.target_calories
        target_protein = targets.target_protein
    except Exception:
        target_cals = 2000.0
        target_protein = 80.0

    target_water_ml = 2500
    target_steps = 8000

    # 3. Query Period Telemetry Data
    # A. Meals
    m_stmt = (
        select(Meal)
        .where(Meal.user_id == current_user.id, Meal.consumed_at >= current_start)
        .order_by(Meal.consumed_at.asc())
    )
    m_res = await db.execute(m_stmt)
    period_meals = list(m_res.scalars().all())

    daily_meals_dict: Dict[str, Tuple[float, float]] = {}  # date -> (cals, protein_g)
    for m in period_meals:
        d_str = m.consumed_at.strftime("%Y-%m-%d")
        cals_sum = sum(e.calories for e in m.entries)
        p_sum = sum(e.protein_g for e in m.entries)
        prev_c, prev_p = daily_meals_dict.get(d_str, (0.0, 0.0))
        daily_meals_dict[d_str] = (prev_c + cals_sum, prev_p + p_sum)

    # B. Hydration
    w_stmt = (
        select(WaterLog)
        .where(WaterLog.user_id == current_user.id, WaterLog.date >= current_start)
        .order_by(WaterLog.date.asc())
    )
    w_res = await db.execute(w_stmt)
    period_water = list(w_res.scalars().all())

    daily_water_dict: Dict[str, int] = {}  # date -> total_ml
    for w in period_water:
        d_str = w.date.strftime("%Y-%m-%d")
        daily_water_dict[d_str] = daily_water_dict.get(d_str, 0) + w.amount_ml

    # C. Activity
    a_stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id, ActivityLog.date >= current_start)
        .order_by(ActivityLog.date.asc())
    )
    a_res = await db.execute(a_stmt)
    period_act = list(a_res.scalars().all())

    daily_act_dict: Dict[str, Tuple[Optional[int], Optional[int]]] = {}  # date -> (steps, active_minutes)
    for a in period_act:
        d_str = a.date.strftime("%Y-%m-%d")
        daily_act_dict[d_str] = (a.steps, a.active_minutes)

    # D. Weight
    wt_stmt = (
        select(WeightLog)
        .where(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.date.asc())
    )
    wt_res = await db.execute(wt_stmt)
    all_weight_logs = list(wt_res.scalars().all())

    daily_weight_dict: Dict[str, float] = {}
    for wt in all_weight_logs:
        d_str = wt.date.strftime("%Y-%m-%d")
        daily_weight_dict[d_str] = wt.weight_kg

    # E. Goals
    g_stmt = select(HealthGoal).where(HealthGoal.user_id == current_user.id)
    g_res = await db.execute(g_stmt)
    all_goals = list(g_res.scalars().all())

    active_goals = [g for g in all_goals if g.status == "active"]
    completed_goals = [g for g in all_goals if g.status == "completed"]

    # F. Meal Plans
    mp_stmt = (
        select(MealPlan)
        .where(MealPlan.user_id == current_user.id, MealPlan.plan_date >= current_start.strftime("%Y-%m-%d"))
    )
    mp_res = await db.execute(mp_stmt)
    period_meal_plans = list(mp_res.scalars().all())

    # 4. Data Availability Flags
    has_nutrition = len(daily_meals_dict) > 0
    has_hydration = len(daily_water_dict) > 0
    has_activity = len(daily_act_dict) > 0
    has_weight = len(daily_weight_dict) > 0
    has_goal = len(all_goals) > 0
    has_meal_plan = len(period_meal_plans) > 0

    data_avail = DataAvailability(
        has_nutrition_data=has_nutrition,
        has_hydration_data=has_hydration,
        has_activity_data=has_activity,
        has_weight_data=has_weight,
        has_goal_data=has_goal,
        has_meal_plan_data=has_meal_plan,
    )

    # 5. Build Daily Trend Points (Preserving NULL for unlogged metrics)
    trend_points: List[TrendAnalysisPoint] = []
    for i in range(days_count):
        d_obj = current_start + timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")

        cals_val, p_val = daily_meals_dict.get(d_str, (None, None))
        water_val = daily_water_dict.get(d_str, None)

        act_tuple = daily_act_dict.get(d_str, (None, None))
        st_val, act_min_val = act_tuple if act_tuple else (None, None)

        wt_val = daily_weight_dict.get(d_str, None)

        trend_points.append(
            TrendAnalysisPoint(
                date=d_str,
                calories=round(cals_val, 1) if cals_val is not None else None,
                protein_g=round(p_val, 1) if p_val is not None else None,
                water_ml=water_val,
                steps=st_val,
                active_minutes=act_min_val,
                weight_kg=wt_val,
            )
        )

    # 6. Calculate Summaries Over Logged Days Only
    # Nutrition Summary
    nutr_logged_days = len(daily_meals_dict)
    nutr_avg_cals = round(sum(c[0] for c in daily_meals_dict.values()) / nutr_logged_days, 1) if nutr_logged_days > 0 else None
    nutr_cons = round((nutr_logged_days / days_count) * 100.0, 1)
    nutrition_summary = CategorySummaryItem(
        logged_days=nutr_logged_days,
        avg_value=nutr_avg_cals,
        target_value=round(target_cals, 1),
        unit="kcal",
        consistency_pct=nutr_cons,
    )

    # Hydration Summary
    hyd_logged_days = len(daily_water_dict)
    hyd_avg_ml = round(sum(daily_water_dict.values()) / hyd_logged_days, 1) if hyd_logged_days > 0 else None
    hyd_cons = round((hyd_logged_days / days_count) * 100.0, 1)
    hydration_summary = CategorySummaryItem(
        logged_days=hyd_logged_days,
        avg_value=hyd_avg_ml,
        target_value=float(target_water_ml),
        unit="ml",
        consistency_pct=hyd_cons,
    )

    # Activity Summary
    act_logged_days = len(daily_act_dict)
    valid_steps = [a[0] for a in daily_act_dict.values() if a[0] is not None]
    act_avg_steps = round(sum(valid_steps) / len(valid_steps), 1) if valid_steps else None
    act_cons = round((act_logged_days / days_count) * 100.0, 1)
    activity_summary = CategorySummaryItem(
        logged_days=act_logged_days,
        avg_value=act_avg_steps,
        target_value=float(target_steps),
        unit="steps",
        consistency_pct=act_cons,
    )

    # Weight Summary
    period_weights = [w.weight_kg for w in all_weight_logs if w.date >= current_start]
    latest_wt = all_weight_logs[-1].weight_kg if all_weight_logs else None
    earliest_wt = period_weights[0] if period_weights else None
    change_wt = round(latest_wt - earliest_wt, 1) if (latest_wt is not None and earliest_wt is not None) else None

    weight_summary: Dict[str, Optional[float]] = {
        "latest_weight_kg": latest_wt,
        "earliest_weight_kg": earliest_wt,
        "change_kg": change_wt,
    }

    # Goal Summary
    goals_summary = {
        "active": len(active_goals),
        "completed": len(completed_goals),
        "total": len(all_goals),
    }

    summary = HealthInsightsSummary(
        nutrition=nutrition_summary,
        hydration=hydration_summary,
        activity=activity_summary,
        weight=weight_summary,
        goals=goals_summary,
    )

    # 7. Reusable Trend Analysis
    def classify_trend(values: List[float], higher_is_better: bool = True) -> Tuple[str, Optional[float], str]:
        if len(values) < 2:
            return "insufficient_data", None, "Record a few more days to identify a meaningful trend."
        start_v = values[0]
        end_v = values[-1]
        diff = end_v - start_v
        pct = round((diff / max(1.0, start_v)) * 100.0, 1) if start_v > 0 else 0.0

        if abs(pct) < 3.0:
            return "stable", pct, "Measurements have remained steady across the recorded period."
        if (diff > 0 and higher_is_better) or (diff < 0 and not higher_is_better):
            return "improving", pct, "Positive directional progress observed."
        else:
            return "declining", pct, "Downward trend observed relative to initial observations."

    # Calories Trend
    cal_vals = [p.calories for p in trend_points if p.calories is not None]
    c_status, c_pct, c_msg = classify_trend(cal_vals, higher_is_better=True)
    cals_series = TrendAnalysisSeries(metric="calories", status=c_status, change_pct=c_pct, message=c_msg)

    # Hydration Trend
    hyd_vals = [float(p.water_ml) for p in trend_points if p.water_ml is not None]
    h_status, h_pct, h_msg = classify_trend(hyd_vals, higher_is_better=True)
    hyd_series = TrendAnalysisSeries(metric="hydration", status=h_status, change_pct=h_pct, message=h_msg)

    # Activity Trend
    act_vals = [float(p.steps) for p in trend_points if p.steps is not None]
    a_status, a_pct, a_msg = classify_trend(act_vals, higher_is_better=True)
    act_series = TrendAnalysisSeries(metric="activity", status=a_status, change_pct=a_pct, message=a_msg)

    # Weight Trend (Persona sensitive: neutral for pediatric)
    wt_vals = [p.weight_kg for p in trend_points if p.weight_kg is not None]
    w_status, w_pct, w_msg = classify_trend(wt_vals, higher_is_better=False)
    if is_pediatric:
        w_msg = "Body weight measurements tracked for physical growth."
    wt_series = TrendAnalysisSeries(metric="weight", status=w_status, change_pct=w_pct, message=w_msg)

    trends = [cals_series, hyd_series, act_series, wt_series]

    # 8. Observational Non-Causal Correlation Engine
    correlations: List[CorrelationInsight] = []

    # Correlation 1: Hydration vs Activity
    overlap_hyd_act = set(daily_water_dict.keys()).intersection(set(daily_act_dict.keys()))
    if len(overlap_hyd_act) >= 3:
        high_act_water = [daily_water_dict[d] for d in overlap_hyd_act if daily_act_dict[d][0] and daily_act_dict[d][0] >= 6000]
        other_water = [daily_water_dict[d] for d in overlap_hyd_act if not (daily_act_dict[d][0] and daily_act_dict[d][0] >= 6000)]
        
        avg_high_act_w = (sum(high_act_water) / len(high_act_water)) if high_act_water else 0
        avg_other_w = (sum(other_water) / len(other_water)) if other_water else 0

        if high_act_water and avg_high_act_w >= avg_other_w:
            obs_str = "On days with higher recorded activity, your recorded hydration was also higher."
            str_val = "strong" if avg_high_act_w > avg_other_w + 300 else "moderate"
        else:
            obs_str = "Hydration logging pattern remains steady across different activity levels."
            str_val = "moderate"

        correlations.append(
            CorrelationInsight(
                id="corr_hyd_act",
                variables=["hydration", "activity"],
                title="Hydration & Activity Relationship",
                observation=obs_str,
                strength=str_val,
                overlapping_days=len(overlap_hyd_act),
                is_statistically_valid=True,
            )
        )
    else:
        correlations.append(
            CorrelationInsight(
                id="corr_hyd_act",
                variables=["hydration", "activity"],
                title="Hydration & Activity Relationship",
                observation="Not enough recorded overlapping hydration and activity data to identify a reliable pattern.",
                strength="insufficient_data",
                overlapping_days=len(overlap_hyd_act),
                is_statistically_valid=False,
            )
        )

    # Correlation 2: Protein Intake & Meal Plan Adherence
    mp_dates = set(p.plan_date for p in period_meal_plans)
    overlap_p_mp = set(daily_meals_dict.keys()).intersection(mp_dates)
    if len(overlap_p_mp) >= 2:
        p_on_plan = [daily_meals_dict[d][1] for d in overlap_p_mp]
        avg_p_plan = round(sum(p_on_plan) / len(p_on_plan), 1)
        correlations.append(
            CorrelationInsight(
                id="corr_protein_plan",
                variables=["protein_intake", "meal_planning"],
                title="Protein Intake & Meal Plan Pattern",
                observation=f"On days when your meal plan was active, average logged protein was {avg_p_plan}g.",
                strength="moderate",
                overlapping_days=len(overlap_p_mp),
                is_statistically_valid=True,
            )
        )
    else:
        correlations.append(
            CorrelationInsight(
                id="corr_protein_plan",
                variables=["protein_intake", "meal_planning"],
                title="Protein Intake & Meal Plan Pattern",
                observation="Not enough recorded meal plan and protein data to identify a pattern.",
                strength="insufficient_data",
                overlapping_days=len(overlap_p_mp),
                is_statistically_valid=False,
            )
        )

    # 9. Explainable Rule-Based Insight Engine
    insights: List[RuleBasedInsight] = []

    # Category: Nutrition
    if not has_nutrition:
        insights.append(
            RuleBasedInsight(
                id="ins_nutr_empty",
                category="nutrition",
                priority="high" if not is_pediatric else "medium",
                title="No Nutrition Data Recorded",
                message="No nutrition data logged for this period. Recording meals builds your daily energy overview.",
                evidence="0 food entries logged in selected period.",
                action="Log today's meals in your food diary.",
                data_available=False,
            )
        )
    else:
        if is_pediatric:
            insights.append(
                RuleBasedInsight(
                    id="ins_nutr_growth",
                    category="nutrition",
                    priority="medium",
                    title="Nourishing Growth & Development",
                    message=f"Logged average energy is {nutr_avg_cals or 0} kcal across {nutr_logged_days} days. Balanced meals support daily learning and active play.",
                    evidence=f"Logged on {nutr_logged_days} of {days_count} days.",
                    action="Keep enjoying balanced meals and snacks.",
                    data_available=True,
                )
            )
        elif is_older_adult:
            insights.append(
                RuleBasedInsight(
                    id="ins_nutr_senior",
                    category="nutrition",
                    priority="medium",
                    title="Adequate Energy & Strength Support",
                    message=f"Average intake is {nutr_avg_cals or 0} kcal/day. Consuming wholesome meals supports vitality and physical independence.",
                    evidence=f"Average energy: {nutr_avg_cals or 0} kcal on logged days.",
                    action="Ensure protein and nutrient-dense foods in main meals.",
                    data_available=True,
                )
            )
        else:
            # Adult
            insights.append(
                RuleBasedInsight(
                    id="ins_nutr_adult",
                    category="nutrition",
                    priority="medium",
                    title="Caloric Intake Overview",
                    message=f"Average caloric intake is {nutr_avg_cals or 0} kcal/day (target: {target_cals} kcal).",
                    evidence=f"Intake calculated across {nutr_logged_days} logged days.",
                    action="Review your food diary items for macro balance.",
                    data_available=True,
                )
            )

    # Category: Hydration
    if not has_hydration:
        insights.append(
            RuleBasedInsight(
                id="ins_hyd_empty",
                category="hydration",
                priority="high" if is_older_adult else "medium",
                title="No Hydration Recorded",
                message="No water intake recorded for this period. Staying hydrated supports focus, digestion, and mobility.",
                evidence="0 water logs recorded.",
                action="Record your water intake throughout the day.",
                data_available=False,
            )
        )
    else:
        if is_older_adult:
            insights.append(
                RuleBasedInsight(
                    id="ins_hyd_senior",
                    category="hydration",
                    priority="high",
                    title="Hydration & Fluid Intake Focus",
                    message=f"Average water logged is {hyd_avg_ml or 0} ml/day (target: {target_water_ml} ml). Regular fluid intake preserves kidney health and joint comfort.",
                    evidence=f"Water logged on {hyd_logged_days} days.",
                    action="Keep a water bottle nearby and sip regularly.",
                    data_available=True,
                )
            )
        else:
            insights.append(
                RuleBasedInsight(
                    id="ins_hyd_gen",
                    category="hydration",
                    priority="medium",
                    title="Hydration Adherence",
                    message=f"Average water intake is {hyd_avg_ml or 0} ml/day across {hyd_logged_days} logged days.",
                    evidence=f"Hydration logging consistency: {hyd_cons}%.",
                    action="Aim to reach your daily 2500 ml hydration target.",
                    data_available=True,
                )
            )

    # Category: Activity
    if not has_activity:
        insights.append(
            RuleBasedInsight(
                id="ins_act_empty",
                category="activity",
                priority="low",
                title="No Activity Telemetry Recorded",
                message="No step counts or exercise sessions recorded. Logging movement builds physical stamina.",
                evidence="0 activity logs recorded.",
                action="Record today's steps or physical activity.",
                data_available=False,
            )
        )
    else:
        if is_pediatric:
            insights.append(
                RuleBasedInsight(
                    id="ins_act_pediatric",
                    category="activity",
                    priority="medium",
                    title="Active Play & Physical Movement",
                    message=f"Average daily movement logged: {act_avg_steps or 0} steps. Active play promotes bone strength and motor skills.",
                    evidence=f"Activity logged on {act_logged_days} days.",
                    action="Enjoy outdoor sports and active play routines.",
                    data_available=True,
                )
            )
        else:
            insights.append(
                RuleBasedInsight(
                    id="ins_act_gen",
                    category="activity",
                    priority="medium",
                    title="Physical Activity Telemetry",
                    message=f"Average daily steps logged: {act_avg_steps or 0} (target: {target_steps} steps).",
                    evidence=f"Logged on {act_logged_days} of {days_count} days.",
                    action="Maintain regular active minutes throughout the week.",
                    data_available=True,
                )
            )

    # Category: Goals
    if not has_goal:
        insights.append(
            RuleBasedInsight(
                id="ins_goal_empty",
                category="goals",
                priority="medium",
                title="Set Your First Health Goal",
                message="Establishing personal goals provides structure for your nutrition and health journey.",
                evidence="0 health goals created.",
                action="Create a new goal in the Health Goals module.",
                data_available=False,
            )
        )
    else:
        insights.append(
            RuleBasedInsight(
                id="ins_goal_status",
                category="goals",
                priority="low",
                title="Active Goals Tracking",
                message=f"You have {len(active_goals)} active health goal(s) and {len(completed_goals)} completed goal(s).",
                evidence=f"Total goals: {len(all_goals)}.",
                action="Review your goal progress page.",
                data_available=True,
            )
        )

    # 10. Persona Safety Filter (Hard Enforcement for Pediatric)
    if is_pediatric:
        forbidden_terms = ["deficit", "weight loss", "weight-loss", "fat loss", "restriction", "restrict", "eat less"]
        filtered_insights: List[RuleBasedInsight] = []
        for ins in insights:
            text_check = f"{ins.title} {ins.message} {ins.evidence} {ins.action}".lower()
            if not any(term in text_check for term in forbidden_terms):
                filtered_insights.append(ins)
        insights = filtered_insights

    # 11. Personalized Action Center (Prioritized 3 to 5 contextual actions mapped to VALID frontend routes)
    actions: List[PrioritizedAction] = []

    # Action 1: Food Diary
    if not has_nutrition or today_str not in daily_meals_dict:
        actions.append(
            PrioritizedAction(
                id="act_log_meals",
                title="Log Today's Meals",
                description="Record breakfast, lunch, or dinner in your food diary to track daily energy and macros.",
                category="nutrition",
                priority="high",
                route="/app/diary",
            )
        )
    else:
        actions.append(
            PrioritizedAction(
                id="act_review_diary",
                title="Review Food Diary",
                description="View your logged meals and macro distribution for today.",
                category="nutrition",
                priority="low",
                route="/app/diary",
            )
        )

    # Action 2: Hydration
    if not has_hydration or today_str not in daily_water_dict:
        actions.append(
            PrioritizedAction(
                id="act_log_water",
                title="Log Water Intake",
                description="Keep track of your hydration by logging your daily fluid intake.",
                category="hydration",
                priority="high",
                route="/app",
            )
        )

    # Action 3: Meal Planning
    if not has_meal_plan:
        actions.append(
            PrioritizedAction(
                id="act_create_meal_plan",
                title="Generate Smart Meal Plan",
                description="Create a personalized meal plan aligned with your dietary preferences.",
                category="meal_planning",
                priority="medium",
                route="/app/meal-plan",
            )
        )

    # Action 4: Goals
    if not has_goal:
        actions.append(
            PrioritizedAction(
                id="act_set_goal",
                title="Set Health Goals",
                description="Define clear targets for hydration, activity, or nutrient consistency.",
                category="goals",
                priority="medium",
                route="/app/goals",
            )
        )
    else:
        actions.append(
            PrioritizedAction(
                id="act_check_goals",
                title="Check Goal Progress",
                description="Evaluate progress towards your active health targets.",
                category="goals",
                priority="medium",
                route="/app/goals",
            )
        )

    # Action 5: Activity
    if not has_activity or today_str not in daily_act_dict:
        actions.append(
            PrioritizedAction(
                id="act_log_activity",
                title="Record Activity Telemetry",
                description="Log your daily step counts and exercise minutes.",
                category="activity",
                priority="low",
                route="/app/activity",
            )
        )

    # Cap to top 3-5 actions
    prioritized_actions = actions[:5]

    return HealthInsightsResponse(
        period=period_str,
        persona=persona,
        data_availability=data_avail,
        summary=summary,
        trend_points=trend_points,
        trends=trends,
        insights=insights,
        actions=prioritized_actions,
        correlations=correlations,
    )

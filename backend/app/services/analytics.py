from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diary import Meal
from app.models.profile import UserProfile
from app.models.user import User
from app.models.weight import WeightLog
from app.models.hydration import WaterLog
from app.models.activity import ActivityLog
from app.schemas.analytics import (
    CalorieAnalytics,
    ClinicalInsightItem,
    ComparisonItem,
    ConsistencyScoreComponents,
    DashboardAnalyticsResponse,
    DataAvailability,
    DayTrendPoint,
    GoalProgressAnalytics,
    HealthOverviewResponse,
    MacroItemAnalytics,
    MacronutrientAnalytics,
    MetricValueUnit,
    OverviewMetrics,
    PersonaAdaptation,
    TodayHealthSummary,
    WeightAnalytics,
    WeeklyTrendAnalytics,
)
from app.services.nutrition import calculate_user_nutrition_targets
from app.services.nutrition_intelligence import get_nutrition_intelligence_service


def parse_period(period: str) -> int:
    """Parse period string ('7d', '14d', '30d', '90d', '6m', '1y') into integer days."""
    p_clean = (period or "30d").lower().strip()
    mapping = {
        "7d": 7,
        "14d": 14,
        "30d": 30,
        "90d": 90,
        "6m": 180,
        "1y": 365,
    }
    if p_clean not in mapping:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid period parameter '{period}'. Supported periods: 7d, 14d, 30d, 90d, 6m, 1y.",
        )
    return mapping[p_clean]


def calculate_trend_direction(values: List[float]) -> str:
    """Determines trend direction ('increasing', 'decreasing', 'stable') from numeric sequence."""
    if len(values) < 2:
        return "stable"
    diff = values[-1] - values[0]
    if abs(diff) < 0.3:
        return "stable"
    return "increasing" if diff > 0 else "decreasing"


def calculate_comparison(current_val: float, previous_val: float) -> ComparisonItem:
    """Computes comparison stats between current and previous period values."""
    abs_change = round(current_val - previous_val, 1)
    if previous_val > 0:
        pct_change = round((abs_change / previous_val) * 100.0, 1)
    else:
        pct_change = None

    if abs(abs_change) < 0.1:
        direction = "stable"
    elif abs_change > 0:
        direction = "increased"
    else:
        direction = "decreased"

    return ComparisonItem(
        current_value=round(current_val, 1),
        previous_value=round(previous_val, 1),
        absolute_change=abs_change,
        percent_change=pct_change,
        direction=direction,
    )


async def get_dashboard_analytics_service(
    db: AsyncSession, current_user: User, period_str: str = "30d"
) -> DashboardAnalyticsResponse:
    """Generates complete longitudinal clinical analytics and insights for current user."""
    days_count = parse_period(period_str)
    now_utc = datetime.now(timezone.utc)
    current_start = (now_utc - timedelta(days=days_count)).replace(hour=0, minute=0, second=0, microsecond=0)
    previous_start = (current_start - timedelta(days=days_count)).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Fetch User Profile and Nutrition Targets
    profile_stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    prof_res = await db.execute(profile_stmt)
    profile = prof_res.scalar_one_or_none()

    try:
        targets = await calculate_user_nutrition_targets(db, current_user.id)
        target_calories = targets.target_calories
        target_protein = targets.target_protein
        target_carbs = targets.target_carbs
        target_fat = targets.target_fat
        target_fiber = targets.target_fiber
    except HTTPException:
        target_calories = 2600.0
        target_protein = 140.0
        target_carbs = 325.0
        target_fat = 75.0
        target_fiber = 30.0

    # 2. Fetch Weight Logs for Current and Previous Periods
    w_curr_stmt = (
        select(WeightLog)
        .where(WeightLog.user_id == current_user.id, WeightLog.date >= current_start)
        .order_by(WeightLog.date.asc())
    )
    w_curr_res = await db.execute(w_curr_stmt)
    curr_weight_logs = list(w_curr_res.scalars().all())

    w_prev_stmt = (
        select(WeightLog)
        .where(
            WeightLog.user_id == current_user.id,
            WeightLog.date >= previous_start,
            WeightLog.date < current_start,
        )
        .order_by(WeightLog.date.asc())
    )
    w_prev_res = await db.execute(w_prev_stmt)
    prev_weight_logs = list(w_prev_res.scalars().all())

    has_weight_data = len(curr_weight_logs) > 0

    if has_weight_data:
        start_wt = curr_weight_logs[0].weight_kg
        curr_wt = curr_weight_logs[-1].weight_kg
        w_values = [w.weight_kg for w in curr_weight_logs]
        avg_wt = round(sum(w_values) / len(w_values), 1)
        min_wt = round(min(w_values), 1)
        max_wt = round(max(w_values), 1)

        # 7-entry trailing moving average
        ma_window = w_values[-7:] if len(w_values) >= 7 else w_values
        ma_7d = round(sum(ma_window) / len(ma_window), 1)
        total_wt_change = round(curr_wt - start_wt, 1)
        wt_change_pct = round((total_wt_change / max(1.0, start_wt)) * 100.0, 1)
        weeks_span = max(1.0, days_count / 7.0)
        weekly_velocity = round(total_wt_change / weeks_span, 2)
        wt_trend_dir = calculate_trend_direction(w_values)
    else:
        start_wt = 0.0
        curr_wt = 0.0
        avg_wt = 0.0
        min_wt = 0.0
        max_wt = 0.0
        ma_7d = 0.0
        total_wt_change = 0.0
        wt_change_pct = 0.0
        weekly_velocity = 0.0
        wt_trend_dir = "stable"

    weight_analytics = WeightAnalytics(
        start_weight=start_wt,
        current_weight=curr_wt,
        total_change_kg=total_wt_change,
        avg_weight=avg_wt,
        min_weight=min_wt,
        max_weight=max_wt,
        weight_change_pct=wt_change_pct,
        weekly_velocity=weekly_velocity,
        moving_average_7d=ma_7d,
        trend_direction=wt_trend_dir,
    )

    # 3. Fetch Food Diary Meals & Line Items for Current and Previous Periods
    m_curr_stmt = (
        select(Meal)
        .where(Meal.user_id == current_user.id, Meal.consumed_at >= current_start)
        .order_by(Meal.consumed_at.asc())
    )
    m_curr_res = await db.execute(m_curr_stmt)
    curr_meals = list(m_curr_res.scalars().all())

    m_prev_stmt = (
        select(Meal)
        .where(
            Meal.user_id == current_user.id,
            Meal.consumed_at >= previous_start,
            Meal.consumed_at < current_start,
        )
        .order_by(Meal.consumed_at.asc())
    )
    m_prev_res = await db.execute(m_prev_stmt)
    prev_meals = list(m_prev_res.scalars().all())

    # Map daily intake for current period
    daily_cals_curr: Dict[datetime.date, float] = {}
    daily_protein_curr: Dict[datetime.date, float] = {}
    daily_carbs_curr: Dict[datetime.date, float] = {}
    daily_fat_curr: Dict[datetime.date, float] = {}
    daily_fiber_curr: Dict[datetime.date, float] = {}

    for m in curr_meals:
        m_d = m.consumed_at.date()
        for e in m.entries:
            daily_cals_curr[m_d] = daily_cals_curr.get(m_d, 0.0) + e.calories
            daily_protein_curr[m_d] = daily_protein_curr.get(m_d, 0.0) + e.protein_g
            daily_carbs_curr[m_d] = daily_carbs_curr.get(m_d, 0.0) + e.carbs_g
            daily_fat_curr[m_d] = daily_fat_curr.get(m_d, 0.0) + e.fat_g
            daily_fiber_curr[m_d] = daily_fiber_curr.get(m_d, 0.0) + e.fiber_g

    logged_days_count = len(daily_cals_curr)
    has_diary_data = logged_days_count > 0

    # Calculate calorie adherence stats (90%-110% tolerance range)
    low_bound = target_calories * 0.90
    high_bound = target_calories * 1.10

    days_meeting = 0
    days_below = 0
    days_above = 0

    total_cals_sum = sum(daily_cals_curr.values()) if daily_cals_curr else 0.0

    for day_cal in daily_cals_curr.values():
        if low_bound <= day_cal <= high_bound:
            days_meeting += 1
        elif day_cal < low_bound:
            days_below += 1
        else:
            days_above += 1

    if has_diary_data:
        avg_daily_cals = round(total_cals_sum / logged_days_count, 1)
        cal_diff = round(avg_daily_cals - target_calories, 1)
        cal_adherence_pct = round((days_meeting / days_count) * 100.0, 1) if days_count > 0 else 0.0
    else:
        avg_daily_cals = 0.0
        cal_diff = 0.0
        cal_adherence_pct = 0.0

    calorie_analytics = CalorieAnalytics(
        target_calories=target_calories,
        avg_daily_calories=avg_daily_cals,
        total_calories_consumed=round(total_cals_sum, 1),
        avg_calorie_diff=cal_diff,
        days_meeting_target=days_meeting,
        days_below_target=days_below,
        days_above_target=days_above,
        adherence_pct=cal_adherence_pct,
    )

    # 4. Macro Analytics
    if has_diary_data:
        avg_p = round(sum(daily_protein_curr.values()) / logged_days_count, 1)
        avg_c = round(sum(daily_carbs_curr.values()) / logged_days_count, 1)
        avg_f = round(sum(daily_fat_curr.values()) / logged_days_count, 1)
        avg_fib = round(sum(daily_fiber_curr.values()) / logged_days_count, 1)
    else:
        avg_p = 0.0
        avg_c = 0.0
        avg_f = 0.0
        avg_fib = 0.0

    def build_macro_item(target: float, avg_val: float, val_list: List[float]) -> MacroItemAnalytics:
        if not has_diary_data:
            return MacroItemAnalytics(
                target=target,
                avg_intake=0.0,
                pct_of_target=0.0,
                adherence_pct=0.0,
                trend="stable",
            )
        pct_target = round((avg_val / max(1.0, target)) * 100.0, 1)
        adh_pct = round(min(100.0, pct_target), 1)
        trend = calculate_trend_direction(val_list) if val_list else "stable"
        return MacroItemAnalytics(
            target=target,
            avg_intake=avg_val,
            pct_of_target=pct_target,
            adherence_pct=adh_pct,
            trend=trend,
        )

    macro_analytics = MacronutrientAnalytics(
        protein=build_macro_item(target_protein, avg_p, list(daily_protein_curr.values())),
        carbs=build_macro_item(target_carbs, avg_c, list(daily_carbs_curr.values())),
        fat=build_macro_item(target_fat, avg_f, list(daily_fat_curr.values())),
        fiber=build_macro_item(target_fiber, avg_fib, list(daily_fiber_curr.values())),
    )

    # 5. Deterministic Nutrition Consistency Score
    if has_diary_data:
        logging_consistency_pct = round((logged_days_count / days_count) * 100.0, 1)
        p_adh_pct = min(100.0, (avg_p / max(1.0, target_protein)) * 100.0)
        fib_adh_pct = min(100.0, (avg_fib / max(1.0, target_fiber)) * 100.0)

        consistency_score_val = int(
            round(
                0.35 * logging_consistency_pct
                + 0.30 * cal_adherence_pct
                + 0.20 * p_adh_pct
                + 0.15 * fib_adh_pct
            )
        )
        consistency_score_val = max(0, min(100, consistency_score_val))
    else:
        logging_consistency_pct = 0.0
        p_adh_pct = 0.0
        fib_adh_pct = 0.0
        consistency_score_val = 0

    consistency_score_components = ConsistencyScoreComponents(
        score=consistency_score_val,
        logging_consistency=logging_consistency_pct,
        calorie_adherence=cal_adherence_pct,
        protein_adherence=round(p_adh_pct, 1),
        fiber_adherence=round(fib_adh_pct, 1),
    )

    # 6. Goal Progress Analytics
    target_wt_val = profile.target_mass_kg if (profile and profile.target_mass_kg) else None
    if target_wt_val is not None and has_weight_data:
        needed_change = abs(target_wt_val - start_wt)
        achieved_change = abs(curr_wt - start_wt)
        if needed_change > 0:
            prog_pct = round(min(100.0, max(0.0, (achieved_change / needed_change) * 100.0)), 1)
        else:
            prog_pct = 100.0

        rem_change = round(abs(target_wt_val - curr_wt), 1)

        if target_wt_val > start_wt:
            direction_to_target = "weight-gain"
        elif target_wt_val < start_wt:
            direction_to_target = "weight-loss"
        else:
            direction_to_target = "maintain"

        goal_progress = GoalProgressAnalytics(
            start_weight=start_wt,
            current_weight=curr_wt,
            target_weight=target_wt_val,
            progress_pct=prog_pct,
            remaining_change_kg=rem_change,
            direction_to_target=direction_to_target,
        )
    else:
        goal_progress = None

    # 7. Previous Period Comparisons
    prev_w_values = [w.weight_kg for w in prev_weight_logs] if prev_weight_logs else []
    prev_avg_wt = sum(prev_w_values) / len(prev_w_values) if prev_w_values else 0.0

    daily_cals_prev: Dict[datetime.date, float] = {}
    daily_p_prev: Dict[datetime.date, float] = {}
    for m in prev_meals:
        m_d = m.consumed_at.date()
        for e in m.entries:
            daily_cals_prev[m_d] = daily_cals_prev.get(m_d, 0.0) + e.calories
            daily_p_prev[m_d] = daily_p_prev.get(m_d, 0.0) + e.protein_g

    prev_logged_days = len(daily_cals_prev)
    prev_avg_cals = sum(daily_cals_prev.values()) / max(1, prev_logged_days) if prev_logged_days > 0 else 0.0
    prev_avg_p = sum(daily_p_prev.values()) / max(1, prev_logged_days) if prev_logged_days > 0 else 0.0
    prev_logging_pct = (prev_logged_days / days_count) * 100.0

    comparisons = {
        "weight": calculate_comparison(curr_wt, prev_avg_wt),
        "calories": calculate_comparison(avg_daily_cals, prev_avg_cals),
        "protein": calculate_comparison(avg_p, prev_avg_p),
        "logging_consistency": calculate_comparison(logging_consistency_pct, prev_logging_pct),
    }

    # 8. Observational Rule-Based Clinical Insight Engine
    insights: List[ClinicalInsightItem] = []

    if not has_diary_data and not has_weight_data:
        insights.append(
            ClinicalInsightItem(
                category="consistency",
                priority="info",
                title="Welcome to PoshanCare",
                description="Start logging your daily meals and weight to unlock personalized nutrition insights and adherence trends.",
            )
        )
    else:
        # Insight 1: Calorie Adherence Observation if diary data exists
        if has_diary_data:
            if avg_daily_cals > high_bound:
                insights.append(
                    ClinicalInsightItem(
                        category="nutrition",
                        priority="warning",
                        title="Calorie Intake Above Target",
                        description=f"Average daily intake ({avg_daily_cals} kcal) exceeds configured target range ({target_calories} kcal).",
                        metric=MetricValueUnit(value=avg_daily_cals, unit="kcal"),
                    )
                )
            elif avg_daily_cals < low_bound:
                insights.append(
                    ClinicalInsightItem(
                        category="nutrition",
                        priority="info",
                        title="Calorie Deficit Observation",
                        description=f"Average daily intake ({avg_daily_cals} kcal) is below configured target ({target_calories} kcal).",
                        metric=MetricValueUnit(value=avg_daily_cals, unit="kcal"),
                    )
                )
            else:
                insights.append(
                    ClinicalInsightItem(
                        category="nutrition",
                        priority="success",
                        title="Caloric Adherence Target Met",
                        description=f"Average caloric intake ({avg_daily_cals} kcal) remains within 90-110% of target.",
                        metric=MetricValueUnit(value=cal_adherence_pct, unit="%"),
                    )
                )

            # Insight 2: Protein Intake Velocity
            if p_adh_pct >= 90.0:
                insights.append(
                    ClinicalInsightItem(
                        category="nutrition",
                        priority="success",
                        title="Optimal Protein Velocity",
                        description=f"Protein intake ({avg_p}g/day) consistently meets prescribed clinical target ({target_protein}g/day).",
                        metric=MetricValueUnit(value=avg_p, unit="g/day"),
                    )
                )
            else:
                insights.append(
                    ClinicalInsightItem(
                        category="nutrition",
                        priority="info",
                        title="Sub-optimal Protein Intake",
                        description=f"Average daily protein ({avg_p}g) is below target ({target_protein}g). Consider lean protein options.",
                        metric=MetricValueUnit(value=avg_p, unit="g/day"),
                    )
                )

        # Insight 3: Weight Trajectory Observation if weight data exists
        if has_weight_data:
            if wt_trend_dir == "increasing":
                insights.append(
                    ClinicalInsightItem(
                        category="weight",
                        priority="info",
                        title="Weight Trajectory Trend",
                        description=f"Recorded body weight shows an upward trajectory (+{weekly_velocity} kg/wk velocity).",
                        metric=MetricValueUnit(value=weekly_velocity, unit="kg/wk"),
                    )
                )
            elif wt_trend_dir == "decreasing":
                insights.append(
                    ClinicalInsightItem(
                        category="weight",
                        priority="info",
                        title="Weight Trajectory Trend",
                        description=f"Recorded body weight shows a downward trajectory ({weekly_velocity} kg/wk velocity).",
                        metric=MetricValueUnit(value=weekly_velocity, unit="kg/wk"),
                    )
                )
            else:
                insights.append(
                    ClinicalInsightItem(
                        category="weight",
                        priority="success",
                        title="Stable Mass Trajectory",
                        description="Body weight trend appears stable over the selected analysis window.",
                        metric=MetricValueUnit(value=curr_wt, unit="kg"),
                    )
                )

        # Insight 4: Logging Consistency
        if has_diary_data:
            if logging_consistency_pct >= 70.0:
                insights.append(
                    ClinicalInsightItem(
                        category="consistency",
                        priority="success",
                        title="High Telemetry Logging Consistency",
                        description=f"Food diary logged on {logged_days_count} of {days_count} days ({logging_consistency_pct}% consistency).",
                        metric=MetricValueUnit(value=logging_consistency_pct, unit="%"),
                    )
                )
            else:
                insights.append(
                    ClinicalInsightItem(
                        category="consistency",
                        priority="warning",
                        title="Logging Telemetry Gap",
                        description=f"Food diary logged on {logged_days_count} of {days_count} days. Consistent logging improves accuracy.",
                        metric=MetricValueUnit(value=logging_consistency_pct, unit="%"),
                    )
                )

    # Hydration Telemetry Analysis
    hyd_stmt = select(WaterLog).where(WaterLog.user_id == current_user.id, WaterLog.date >= current_start)
    hyd_res = await db.execute(hyd_stmt)
    hyd_logs = list(hyd_res.scalars().all())

    hyd_days_dict: Dict[datetime.date, int] = {}
    for h in hyd_logs:
        h_d = h.date.date()
        hyd_days_dict[h_d] = hyd_days_dict.get(h_d, 0) + h.amount_ml

    has_hydration_data = len(hyd_days_dict) > 0
    hydration_logged_days = len(hyd_days_dict)
    avg_daily_water_ml = round(sum(hyd_days_dict.values()) / hydration_logged_days, 1) if has_hydration_data else None

    # Activity Telemetry Analysis
    act_stmt = select(ActivityLog).where(ActivityLog.user_id == current_user.id, ActivityLog.date >= current_start)
    act_res = await db.execute(act_stmt)
    act_logs = list(act_res.scalars().all())

    has_activity_data = len(act_logs) > 0
    activity_logged_days = len(act_logs)
    steps_list = [a.steps for a in act_logs if a.steps is not None]
    avg_daily_steps = round(sum(steps_list) / len(steps_list), 1) if steps_list else None

    # Overview Metrics
    overview = OverviewMetrics(
        current_weight=curr_wt,
        weight_change_kg=total_wt_change,
        avg_daily_calories=avg_daily_cals,
        protein_adherence_pct=round(p_adh_pct, 1),
        consistency_score=consistency_score_val,
    )

    return DashboardAnalyticsResponse(
        period=period_str,
        days_in_period=days_count,
        has_weight_data=has_weight_data,
        has_diary_data=has_diary_data,
        has_activity_data=has_activity_data,
        has_hydration_data=has_hydration_data,
        logged_days_count=logged_days_count,
        activity_logged_days=activity_logged_days,
        hydration_logged_days=hydration_logged_days,
        avg_daily_water_ml=avg_daily_water_ml,
        avg_daily_steps=avg_daily_steps,
        overview=overview,
        weight=weight_analytics,
        calories=calorie_analytics,
        macros=macro_analytics,
        consistency=consistency_score_components,
        goals=goal_progress,
        comparisons=comparisons,
        insights=insights,
    )


def build_persona_adaptation(profile_type: Optional[str]) -> PersonaAdaptation:
    pt = (profile_type or "adult").lower().strip()
    if pt == "child":
        return PersonaAdaptation(
            profile_type="child",
            headline="Growth, Energy & Active Play Dashboard",
            subtext="Focus on wholesome nutrition, energy for learning & play, and healthy daily hydration.",
            focus_areas=["Growth Support", "Active Play", "Wholesome Meals", "Daily Water Intake"],
        )
    elif pt == "teen":
        return PersonaAdaptation(
            profile_type="teen",
            headline="Teen Energy & Balanced Nutrition Overview",
            subtext="Fuel your growing body with balanced nutrition, steady hydration, and positive movement routines.",
            focus_areas=["Balanced Nutrition", "Growth & Stamina", "Hydration Habits", "Active Lifestyle"],
        )
    elif pt == "older_adult":
        return PersonaAdaptation(
            profile_type="older_adult",
            headline="Senior & Elder Wellness Dashboard",
            subtext="Simple, readable daily overview prioritizing muscle-supportive protein, regular hydration, and mobility.",
            focus_areas=["Protein Intake", "Daily Hydration", "Gentle Movement", "Bone & Muscle Support"],
        )
    elif pt == "family":
        return PersonaAdaptation(
            profile_type="family",
            headline="Family Household Health Overview",
            subtext="Comprehensive household nutrition summary supporting healthy habits for all family members.",
            focus_areas=["Balanced Family Meals", "Hydration Routine", "Shared Active Habits", "Nourishment"],
        )
    else:
        return PersonaAdaptation(
            profile_type="adult",
            headline="Personalized Health & Nutrition Overview",
            subtext="Real-time telemetry tracking your daily energy, macros, hydration, activity, and weight trends.",
            focus_areas=["Nutrition Targets", "Hydration Progress", "Daily Activity", "Longitudinal Trends"],
        )


async def get_health_overview_service(
    db: AsyncSession, current_user: User, period_str: str = "7d"
) -> HealthOverviewResponse:
    """Unified health overview aggregating nutrition, hydration, activity, weight, and intelligence data."""
    days_count = parse_period(period_str)
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    current_start = (today_start - timedelta(days=days_count - 1))
    today_str = today_start.strftime("%Y-%m-%d")

    # 1. Profile & Nutrition Targets
    prof_stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()
    profile_type = profile.profile_type if profile else "adult"
    persona = build_persona_adaptation(profile_type)

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

    target_water_ml = 2500

    # 2. Fetch Period Telemetry Data (Single Window Batch Queries)
    meals_stmt = (
        select(Meal)
        .where(Meal.user_id == current_user.id, Meal.consumed_at >= current_start)
        .order_by(Meal.consumed_at.asc())
    )
    meals_res = await db.execute(meals_stmt)
    period_meals = list(meals_res.scalars().all())

    water_stmt = (
        select(WaterLog)
        .where(WaterLog.user_id == current_user.id, WaterLog.date >= current_start)
        .order_by(WaterLog.date.asc())
    )
    water_res = await db.execute(water_stmt)
    period_water = list(water_res.scalars().all())

    act_stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id, ActivityLog.date >= current_start)
        .order_by(ActivityLog.date.asc())
    )
    act_res = await db.execute(act_stmt)
    period_act = list(act_res.scalars().all())

    w_stmt = (
        select(WeightLog)
        .where(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.date.asc())
    )
    w_res = await db.execute(w_stmt)
    all_weight_logs = list(w_res.scalars().all())

    latest_weight = all_weight_logs[-1].weight_kg if all_weight_logs else None

    # Group period data by date YYYY-MM-DD
    daily_meals_dict: Dict[str, Tuple[float, float]] = {}
    today_cals = 0.0
    today_p = 0.0
    today_c = 0.0
    today_f = 0.0
    has_nutrition_today = False

    for m in period_meals:
        d_str = m.consumed_at.strftime("%Y-%m-%d")
        for e in m.entries:
            cals, p_g, c_g, f_g = e.calories, e.protein_g, e.carbs_g, e.fat_g
            prev_c, prev_p = daily_meals_dict.get(d_str, (0.0, 0.0))
            daily_meals_dict[d_str] = (prev_c + cals, prev_p + p_g)
            if d_str == today_str:
                has_nutrition_today = True
                today_cals += cals
                today_p += p_g
                today_c += c_g
                today_f += f_g

    daily_water_dict: Dict[str, int] = {}
    today_water_ml = 0
    has_hydration_today = False

    for w in period_water:
        d_str = w.date.strftime("%Y-%m-%d")
        daily_water_dict[d_str] = daily_water_dict.get(d_str, 0) + w.amount_ml
        if d_str == today_str:
            has_hydration_today = True
            today_water_ml += w.amount_ml

    daily_act_dict: Dict[str, ActivityLog] = {}
    today_activity = None
    has_activity_today = False

    for a in period_act:
        d_str = a.date.strftime("%Y-%m-%d")
        daily_act_dict[d_str] = a
        if d_str == today_str:
            has_activity_today = True
            today_activity = a

    daily_weight_dict: Dict[str, float] = {}
    for w in all_weight_logs:
        d_str = w.date.strftime("%Y-%m-%d")
        daily_weight_dict[d_str] = w.weight_kg

    # 3. Today Summary
    hydration_pct = round(min(100.0, (today_water_ml / target_water_ml) * 100.0), 1)
    rem_water_ml = max(0, target_water_ml - today_water_ml)

    today_summary = TodayHealthSummary(
        date=today_str,
        calories=round(today_cals, 1),
        target_calories=round(target_calories, 1),
        protein_g=round(today_p, 1),
        target_protein_g=round(target_protein, 1),
        carbs_g=round(today_c, 1),
        target_carbs_g=round(target_carbs, 1),
        fat_g=round(today_f, 1),
        target_fat_g=round(target_fat, 1),
        water_ml=today_water_ml,
        target_water_ml=target_water_ml,
        hydration_pct=hydration_pct,
        remaining_water_ml=rem_water_ml,
        steps=today_activity.steps if today_activity else None,
        active_minutes=today_activity.active_minutes if today_activity else None,
        exercise_minutes=today_activity.exercise_minutes if today_activity else None,
        activity_level=today_activity.activity_level if today_activity else None,
        current_weight_kg=latest_weight,
    )

    # 4. Weekly Trend Points
    trend_days: List[DayTrendPoint] = []
    cals_list: List[float] = []
    water_list: List[int] = []
    steps_list: List[int] = []
    active_mins_list: List[int] = []

    for i in range(days_count):
        d_obj = current_start + timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")

        has_meal = d_str in daily_meals_dict
        cals_val, p_val = daily_meals_dict[d_str] if has_meal else (None, None)
        if cals_val is not None:
            cals_list.append(cals_val)

        has_water = d_str in daily_water_dict
        water_val = daily_water_dict[d_str] if has_water else None
        if water_val is not None:
            water_list.append(water_val)

        has_act = d_str in daily_act_dict
        act_obj = daily_act_dict.get(d_str)
        st_val = act_obj.steps if (act_obj and act_obj.steps is not None) else None
        act_mins_val = act_obj.active_minutes if (act_obj and act_obj.active_minutes is not None) else None
        if st_val is not None:
            steps_list.append(st_val)
        if act_mins_val is not None:
            active_mins_list.append(act_mins_val)

        has_wt = d_str in daily_weight_dict
        wt_val = daily_weight_dict.get(d_str)

        trend_days.append(
            DayTrendPoint(
                date=d_str,
                has_meal_log=has_meal,
                calories=round(cals_val, 1) if cals_val is not None else None,
                protein_g=round(p_val, 1) if p_val is not None else None,
                has_water_log=has_water,
                water_ml=water_val,
                has_activity_log=has_act,
                steps=st_val,
                active_minutes=act_mins_val,
                has_weight_log=has_wt,
                weight_kg=wt_val,
            )
        )

    avg_cals = round(sum(cals_list) / len(cals_list), 1) if cals_list else None
    avg_water = round(sum(water_list) / len(water_list), 1) if water_list else None
    avg_steps = round(sum(steps_list) / len(steps_list), 1) if steps_list else None
    avg_act_mins = round(sum(active_mins_list) / len(active_mins_list), 1) if active_mins_list else None

    weekly_trends = WeeklyTrendAnalytics(
        days=trend_days,
        avg_daily_calories=avg_cals,
        avg_daily_water_ml=avg_water,
        avg_daily_steps=avg_steps,
        avg_daily_active_mins=avg_act_mins,
    )

    # 5. Data Availability Flags
    has_weekly = len(cals_list) > 0 or len(water_list) > 0 or len(steps_list) > 0
    data_avail = DataAvailability(
        has_nutrition_today=has_nutrition_today,
        has_hydration_today=has_hydration_today,
        has_activity_today=has_activity_today,
        has_weight_data=latest_weight is not None,
        has_weekly_data=has_weekly,
    )

    # 6. Nutrition Intelligence Integration
    intel_response = await get_nutrition_intelligence_service(db, current_user, today_str)

    return HealthOverviewResponse(
        period=period_str,
        days_in_period=days_count,
        data_availability=data_avail,
        today=today_summary,
        weekly_trends=weekly_trends,
        intelligence=intel_response,
        persona=persona,
    )


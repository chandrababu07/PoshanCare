from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diary import Meal
from app.models.profile import UserProfile
from app.models.user import User
from app.models.weight import WeightLog
from app.schemas.analytics import (
    CalorieAnalytics,
    ClinicalInsightItem,
    ComparisonItem,
    ConsistencyScoreComponents,
    DashboardAnalyticsResponse,
    GoalProgressAnalytics,
    MacroItemAnalytics,
    MacronutrientAnalytics,
    MetricValueUnit,
    OverviewMetrics,
    WeightAnalytics,
)
from app.services.nutrition import calculate_user_nutrition_targets


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

    # Fallback weights if no logs exist
    baseline_wt = profile.current_mass_kg if (profile and profile.current_mass_kg) else 68.0

    if curr_weight_logs:
        start_wt = curr_weight_logs[0].weight_kg
        curr_wt = curr_weight_logs[-1].weight_kg
        w_values = [w.weight_kg for w in curr_weight_logs]
        avg_wt = round(sum(w_values) / len(w_values), 1)
        min_wt = round(min(w_values), 1)
        max_wt = round(max(w_values), 1)

        # 7-entry trailing moving average
        ma_window = w_values[-7:] if len(w_values) >= 7 else w_values
        ma_7d = round(sum(ma_window) / len(ma_window), 1)
    else:
        start_wt = baseline_wt
        curr_wt = baseline_wt
        avg_wt = baseline_wt
        min_wt = baseline_wt
        max_wt = baseline_wt
        ma_7d = baseline_wt
        w_values = [baseline_wt]

    total_wt_change = round(curr_wt - start_wt, 1)
    wt_change_pct = round((total_wt_change / max(1.0, start_wt)) * 100.0, 1)

    weeks_span = max(1.0, days_count / 7.0)
    weekly_velocity = round(total_wt_change / weeks_span, 2)
    wt_trend_dir = calculate_trend_direction(w_values)

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

    avg_daily_cals = round(total_cals_sum / max(1, logged_days_count), 1) if logged_days_count > 0 else target_calories
    cal_diff = round(avg_daily_cals - target_calories, 1)
    cal_adherence_pct = round((days_meeting / max(1, days_count)) * 100.0, 1) if days_count > 0 else 0.0

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
    avg_p = round(sum(daily_protein_curr.values()) / max(1, logged_days_count), 1) if logged_days_count > 0 else target_protein
    avg_c = round(sum(daily_carbs_curr.values()) / max(1, logged_days_count), 1) if logged_days_count > 0 else target_carbs
    avg_f = round(sum(daily_fat_curr.values()) / max(1, logged_days_count), 1) if logged_days_count > 0 else target_fat
    avg_fib = round(sum(daily_fiber_curr.values()) / max(1, logged_days_count), 1) if logged_days_count > 0 else target_fiber

    def build_macro_item(target: float, avg_val: float, val_list: List[float]) -> MacroItemAnalytics:
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
    # score = round(0.35 * logging_consistency + 0.30 * calorie_adherence + 0.20 * protein_adherence + 0.15 * fiber_adherence)
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

    consistency_score_components = ConsistencyScoreComponents(
        score=consistency_score_val,
        logging_consistency=logging_consistency_pct,
        calorie_adherence=cal_adherence_pct,
        protein_adherence=round(p_adh_pct, 1),
        fiber_adherence=round(fib_adh_pct, 1),
    )

    # 6. Goal Progress Analytics
    target_wt_val = profile.target_mass_kg if (profile and profile.target_mass_kg) else None
    if target_wt_val is not None:
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
    prev_w_values = [w.weight_kg for w in prev_weight_logs] if prev_weight_logs else [start_wt]
    prev_avg_wt = sum(prev_w_values) / len(prev_w_values)

    daily_cals_prev: Dict[datetime.date, float] = {}
    daily_p_prev: Dict[datetime.date, float] = {}
    for m in prev_meals:
        m_d = m.consumed_at.date()
        for e in m.entries:
            daily_cals_prev[m_d] = daily_cals_prev.get(m_d, 0.0) + e.calories
            daily_p_prev[m_d] = daily_p_prev.get(m_d, 0.0) + e.protein_g

    prev_logged_days = len(daily_cals_prev)
    prev_avg_cals = sum(daily_cals_prev.values()) / max(1, prev_logged_days) if prev_logged_days > 0 else target_calories
    prev_avg_p = sum(daily_p_prev.values()) / max(1, prev_logged_days) if prev_logged_days > 0 else target_protein
    prev_logging_pct = (prev_logged_days / days_count) * 100.0

    comparisons = {
        "weight": calculate_comparison(curr_wt, prev_avg_wt),
        "calories": calculate_comparison(avg_daily_cals, prev_avg_cals),
        "protein": calculate_comparison(avg_p, prev_avg_p),
        "logging_consistency": calculate_comparison(logging_consistency_pct, prev_logging_pct),
    }

    # 8. Observational Rule-Based Clinical Insight Engine
    insights: List[ClinicalInsightItem] = []

    # Insight 1: Calorie Adherence Observation
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

    # Insight 3: Weight Trajectory Observation
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
        overview=overview,
        weight=weight_analytics,
        calories=calorie_analytics,
        macros=macro_analytics,
        consistency=consistency_score_components,
        goals=goal_progress,
        comparisons=comparisons,
        insights=insights,
    )

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MetricValueUnit(BaseModel):
    value: float
    unit: str


class ClinicalInsightItem(BaseModel):
    category: str = Field(..., description="Category: 'nutrition', 'weight', or 'consistency'")
    priority: str = Field(..., description="Priority: 'info', 'success', or 'warning'")
    title: str
    description: str
    metric: Optional[MetricValueUnit] = None


class ComparisonItem(BaseModel):
    current_value: float
    previous_value: float
    absolute_change: float
    percent_change: Optional[float] = None
    direction: str = Field(..., description="Direction: 'increased', 'decreased', or 'stable'")


class OverviewMetrics(BaseModel):
    current_weight: float
    weight_change_kg: float
    avg_daily_calories: float
    protein_adherence_pct: float
    consistency_score: int


class WeightAnalytics(BaseModel):
    start_weight: float
    current_weight: float
    total_change_kg: float
    avg_weight: float
    min_weight: float
    max_weight: float
    weight_change_pct: float
    weekly_velocity: float
    moving_average_7d: float
    trend_direction: str  # 'increasing', 'decreasing', 'stable'


class CalorieAnalytics(BaseModel):
    target_calories: float
    avg_daily_calories: float
    total_calories_consumed: float
    avg_calorie_diff: float
    days_meeting_target: int
    days_below_target: int
    days_above_target: int
    adherence_pct: float


class MacroItemAnalytics(BaseModel):
    target: float
    avg_intake: float
    pct_of_target: float
    adherence_pct: float
    trend: str  # 'increasing', 'decreasing', 'stable'


class MacronutrientAnalytics(BaseModel):
    protein: MacroItemAnalytics
    carbs: MacroItemAnalytics
    fat: MacroItemAnalytics
    fiber: MacroItemAnalytics


class ConsistencyScoreComponents(BaseModel):
    score: int
    logging_consistency: float
    calorie_adherence: float
    protein_adherence: float
    fiber_adherence: float


class GoalProgressAnalytics(BaseModel):
    start_weight: float
    current_weight: float
    target_weight: Optional[float] = None
    progress_pct: float
    remaining_change_kg: float
    direction_to_target: str  # 'weight-loss', 'weight-gain', 'maintain'


class DashboardAnalyticsResponse(BaseModel):
    period: str
    days_in_period: int
    overview: OverviewMetrics
    weight: WeightAnalytics
    calories: CalorieAnalytics
    macros: MacronutrientAnalytics
    consistency: ConsistencyScoreComponents
    goals: Optional[GoalProgressAnalytics] = None
    comparisons: Dict[str, ComparisonItem]
    insights: List[ClinicalInsightItem]

    model_config = ConfigDict(from_attributes=True)

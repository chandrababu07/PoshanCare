from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.nutrition_intelligence import NutritionIntelligenceResponse


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
    has_weight_data: bool = True
    has_diary_data: bool = True
    has_activity_data: bool = False
    has_hydration_data: bool = False
    logged_days_count: int = 0
    activity_logged_days: int = 0
    hydration_logged_days: int = 0
    avg_daily_water_ml: Optional[float] = None
    avg_daily_steps: Optional[float] = None
    overview: OverviewMetrics
    weight: WeightAnalytics
    calories: CalorieAnalytics
    macros: MacronutrientAnalytics
    consistency: ConsistencyScoreComponents
    goals: Optional[GoalProgressAnalytics] = None
    comparisons: Dict[str, ComparisonItem]
    insights: List[ClinicalInsightItem]

    model_config = ConfigDict(from_attributes=True)


class TodayHealthSummary(BaseModel):
    date: str
    calories: float = 0.0
    target_calories: float = 2000.0
    protein_g: float = 0.0
    target_protein_g: float = 80.0
    carbs_g: float = 0.0
    target_carbs_g: float = 250.0
    fat_g: float = 0.0
    target_fat_g: float = 65.0
    water_ml: int = 0
    target_water_ml: int = 2500
    hydration_pct: float = 0.0
    remaining_water_ml: int = 2500
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    exercise_minutes: Optional[int] = None
    activity_level: Optional[str] = None
    current_weight_kg: Optional[float] = None


class DayTrendPoint(BaseModel):
    date: str
    has_meal_log: bool = False
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    has_water_log: bool = False
    water_ml: Optional[int] = None
    hydration_pct: Optional[float] = None
    has_activity_log: bool = False
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    exercise_minutes: Optional[int] = None
    has_weight_log: bool = False
    weight_kg: Optional[float] = None


class WeeklyTrendAnalytics(BaseModel):
    days: List[DayTrendPoint] = []
    avg_daily_calories: Optional[float] = None
    avg_daily_water_ml: Optional[float] = None
    avg_daily_steps: Optional[float] = None
    avg_daily_active_mins: Optional[float] = None


class DataAvailability(BaseModel):
    has_nutrition_today: bool = False
    has_hydration_today: bool = False
    has_activity_today: bool = False
    has_weight_data: bool = False
    has_weekly_data: bool = False


class PersonaAdaptation(BaseModel):
    profile_type: str
    headline: str
    subtext: str
    focus_areas: List[str] = []


class HealthOverviewResponse(BaseModel):
    period: str
    days_in_period: int
    data_availability: DataAvailability
    today: TodayHealthSummary
    weekly_trends: WeeklyTrendAnalytics
    intelligence: NutritionIntelligenceResponse
    persona: PersonaAdaptation

    model_config = ConfigDict(from_attributes=True)


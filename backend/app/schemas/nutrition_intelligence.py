from typing import List, Optional
from pydantic import BaseModel, Field


class NutritionSummaryItem(BaseModel):
    actual: float = Field(..., description="Actual consumed value")
    target: float = Field(..., description="Target value")
    status: str = Field(..., description="Status: within_range, below_target, above_target")


class MacroSummaryItem(BaseModel):
    actual_g: float = Field(..., description="Actual consumed macro in grams")
    target_g: float = Field(..., description="Target macro in grams")
    status: str = Field(..., description="Status: within_range, below_target, above_target")


class IntelligenceSummary(BaseModel):
    calories: NutritionSummaryItem
    protein: MacroSummaryItem
    carbs_g: float
    target_carbs_g: float
    fat_g: float
    target_fat_g: float
    fiber_g: float = 0.0
    target_fiber_g: float = 0.0


class IntelligenceInsight(BaseModel):
    type: str = Field(..., description="Insight type: protein, calories, meal_balance, habit, health_context, timing, hydration")
    severity: str = Field(..., description="Severity level: info, success, warning")
    title: str = Field(..., description="Short headline title")
    message: str = Field(..., description="Actionable user message")
    reason: str = Field(..., description="Explainable rule-based rationale")


class FoodRecommendationItem(BaseModel):
    food_id: int = Field(..., description="Database primary key ID of real food item")
    food_name: str
    category: str
    region: str
    is_vegetarian: bool
    reason: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class IntelligenceRecommendation(BaseModel):
    category: str = Field(..., description="Category: protein, balanced_meal, regional, snack, hydration, fiber")
    title: str
    message: str
    foods: List[FoodRecommendationItem] = []


class IntelligenceDataQuality(BaseModel):
    logged_meals: int = Field(..., description="Number of meals logged today")
    logged_days: int = Field(..., description="Number of unique days logged in recent history")
    has_weight_data: bool = Field(..., description="Whether user has weight logs")
    has_profile: bool = Field(..., description="Whether user has completed profile biometrics")


# === PHASE 2.13 EXTENSIONS ===

class DataAvailabilitySummary(BaseModel):
    period: str = Field(..., description="Aggregation period evaluated (e.g. 7d, 14d, 30d)")
    sufficiency_level: str = Field(..., description="'insufficient_data' | 'limited_data' | 'moderate_data' | 'strong_pattern'")
    logged_days: int = Field(..., description="Number of unique days with meal logs in this period")
    total_meals_logged: int = Field(..., description="Total meal logs in this period")
    unique_foods_logged: int = Field(..., description="Unique food items recorded in this period")
    has_water_logs: bool = Field(..., description="Whether water logs exist in this period")
    has_activity_logs: bool = Field(..., description="Whether activity logs exist in this period")
    active_goals_count: int = Field(..., description="Count of active user health goals")
    explanation: str = Field(..., description="Clear human explanation of data sufficiency")


class NutrientGapItem(BaseModel):
    nutrient: str = Field(..., description="Nutrient name, e.g. Protein, Dietary Fiber, Healthy Fats, Sodium")
    observed_daily_avg: float = Field(..., description="Observed daily average across period")
    target_value: float = Field(..., description="Target or reference daily value")
    unit: str = Field(..., description="Unit of measurement: g, mg, kcal")
    status: str = Field(..., description="'below_target' | 'within_range' | 'above_target' | 'insufficient_data'")
    percentage_of_target: Optional[float] = Field(None, description="Percentage of target achieved")
    confidence: str = Field(..., description="Evidence confidence: 'limited_data' | 'moderate_data' | 'strong_pattern'")
    explanation: str = Field(..., description="Observational, non-diagnostic statement")
    suggested_foods: List[str] = Field(default_factory=list, description="Names of compatible database food suggestions")


class NutritionPatternItem(BaseModel):
    id: str
    title: str
    observation: str
    evidence: str = Field(..., description="Specific data evidence, e.g. 'Observed across 5 logged days'")
    priority: str = Field(..., description="'high' | 'medium' | 'low'")
    category: str = Field(..., description="'nutrient_balance' | 'variety' | 'hydration' | 'timing' | 'growth'")


class SmartSubstitutionItem(BaseModel):
    current_food_name: str
    suggested_food_name: str
    food_id: int
    category: str
    measurable_reason: str = Field(..., description="Measurable nutritional comparison, e.g. 'Provides 3.5g more fiber per serving'")
    calories: float
    protein_g: float
    fiber_g: float


class MealVarietyAnalysis(BaseModel):
    unique_foods_count: int
    food_groups_represented: List[str]
    diversity_score: str = Field(..., description="'insufficient_data' | 'needs_variety' | 'moderate_variety' | 'diverse_intake'")
    observation: str


class MealTimingAnalysis(BaseModel):
    has_timing_data: bool
    avg_breakfast_time: Optional[str] = None
    avg_lunch_time: Optional[str] = None
    avg_dinner_time: Optional[str] = None
    eating_window_hours: Optional[float] = None
    observation: str


class HydrationActivityContext(BaseModel):
    has_combined_data: bool
    active_days_count: int
    avg_water_on_active_days_ml: Optional[int] = None
    avg_water_on_rest_days_ml: Optional[int] = None
    observation: str


class GoalAlignmentItem(BaseModel):
    goal_id: int
    goal_type: str
    title: str
    target_summary: str
    current_status: str
    supportive_action: str


class NutritionActionItem(BaseModel):
    id: str
    title: str
    description: str
    priority: str = Field(..., description="'high' | 'medium' | 'low'")
    category: str
    route: Optional[str] = None


class NutritionIntelligenceResponse(BaseModel):
    # Existing Baseline Fields
    has_sufficient_data: bool = Field(..., description="True if enough logged data exists to construct detailed insights")
    insufficient_data_reason: Optional[str] = Field(None, description="Explanation if data is insufficient")
    summary: Optional[IntelligenceSummary] = None
    insights: List[IntelligenceInsight] = Field(default_factory=list)
    recommendations: List[IntelligenceRecommendation] = Field(default_factory=list)
    data_quality: IntelligenceDataQuality

    # Phase 2.13 Advanced Intelligence Extensions
    period: str = Field(default="7d", description="Analyzed period")
    data_availability: Optional[DataAvailabilitySummary] = None
    nutrient_gaps: List[NutrientGapItem] = Field(default_factory=list)
    patterns: List[NutritionPatternItem] = Field(default_factory=list)
    substitutions: List[SmartSubstitutionItem] = Field(default_factory=list)
    variety_analysis: Optional[MealVarietyAnalysis] = None
    meal_timing: Optional[MealTimingAnalysis] = None
    hydration_activity_context: Optional[HydrationActivityContext] = None
    goal_alignment: List[GoalAlignmentItem] = Field(default_factory=list)
    daily_actions: List[NutritionActionItem] = Field(default_factory=list)

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
    type: str = Field(..., description="Insight type: protein, calories, meal_balance, habit, health_context")
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
    category: str = Field(..., description="Category: protein, balanced_meal, regional, snack, hydration")
    title: str
    message: str
    foods: List[FoodRecommendationItem] = []


class IntelligenceDataQuality(BaseModel):
    logged_meals: int = Field(..., description="Number of meals logged today")
    logged_days: int = Field(..., description="Number of unique days logged in recent history")
    has_weight_data: bool = Field(..., description="Whether user has weight logs")
    has_profile: bool = Field(..., description="Whether user has a completed profile biometrics")


class NutritionIntelligenceResponse(BaseModel):
    has_sufficient_data: bool = Field(..., description="True if enough logged data exists to construct detailed insights")
    insufficient_data_reason: Optional[str] = Field(None, description="Explanation if data is insufficient")
    summary: Optional[IntelligenceSummary] = None
    insights: List[IntelligenceInsight] = []
    recommendations: List[IntelligenceRecommendation] = []
    data_quality: IntelligenceDataQuality

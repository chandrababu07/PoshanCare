from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MealPlanItemResponse(BaseModel):
    id: int
    food_id: int
    food_name: str
    category: str
    servings: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MealGroupResponse(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    items: List[MealPlanItemResponse]


class MealPlanNutritionSummary(BaseModel):
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float


class MealPlanDataQuality(BaseModel):
    has_profile_data: bool
    has_nutrition_data: bool
    has_food_catalog_data: bool
    has_recent_history: bool
    has_sufficient_data: bool
    quality_note: str


class MealPlanResponse(BaseModel):
    id: int
    plan_date: str
    persona: str
    status: str
    meals: List[MealGroupResponse]
    nutrition_summary: MealPlanNutritionSummary
    data_quality: MealPlanDataQuality

    model_config = ConfigDict(from_attributes=True)


class MealRecommendationItem(BaseModel):
    food_id: int
    food_name: str
    category: str
    region: str
    is_vegetarian: bool
    servings: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    suggested_meal_type: str
    reason: str
    confidence_score: float
    preference_compatible: bool
    avoidance_safe: bool

    model_config = ConfigDict(from_attributes=True)


class MealRecommendationResponse(BaseModel):
    recommendations: List[MealRecommendationItem]
    suggested_meal_type: str
    data_quality: MealPlanDataQuality


class GenerateMealPlanRequest(BaseModel):
    plan_date: Optional[str] = None  # YYYY-MM-DD
    meal_types: Optional[List[str]] = Field(
        default_factory=lambda: ["breakfast", "lunch", "dinner", "snack"]
    )


class AddMealPlanItemRequest(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    food_id: int
    servings: Optional[float] = 1.0
    suggested_reason: Optional[str] = None

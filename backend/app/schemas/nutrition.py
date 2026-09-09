from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class StatelessCalculateRequest(BaseModel):
    age: int = Field(..., ge=10, le=120, description="Age in years")
    biological_sex: str = Field(..., description="'male' | 'female' | 'unspecified'")
    height_cm: float = Field(..., ge=50.0, le=250.0, description="Height in centimeters")
    weight_kg: float = Field(..., ge=20.0, le=300.0, description="Weight in kilograms")
    activity_level: str = Field(
        ...,
        description="'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active'",
    )
    primary_goal: str = Field(..., description="'maintain' | 'fat-loss' | 'muscle' | 'improve'")
    progression_pace: Optional[str] = Field("gradual", description="'gradual' | 'moderate'")
    target_mass_kg: Optional[float] = Field(None, ge=20.0, le=300.0)


class NutritionTargetsResponse(BaseModel):
    bmr: float = Field(..., description="Basal Metabolic Rate in kcal")
    tdee: float = Field(..., description="Total Daily Energy Expenditure in kcal")
    target_calories: float = Field(..., description="Goal-adjusted daily caloric target in kcal")
    target_protein: float = Field(..., description="Target protein intake in grams")
    target_carbs: float = Field(..., description="Target carbohydrate intake in grams")
    target_fat: float = Field(..., description="Target fat intake in grams")
    target_fiber: float = Field(..., description="Target dietary fiber intake in grams")
    pal_multiplier: float = Field(..., description="Physical Activity Level multiplier")
    goal_adjustment_calories: float = Field(..., description="Caloric adjustment applied for primary goal")
    protein_g_per_kg: float = Field(..., description="Protein ratio in grams per kg body weight")
    methodology: str = Field("Mifflin-St Jeor (1990) & ICMR 2024 Guidelines")

    model_config = ConfigDict(from_attributes=True)


class MacroItemSummary(BaseModel):
    target: float
    consumed: float
    remaining: float
    adherence_pct: float


class NutritionSummaryResponse(BaseModel):
    date: str
    target_calories: float
    consumed_calories: float
    remaining_calories: float
    caloric_adherence_pct: float
    caloric_status_text: str
    
    protein: MacroItemSummary
    carbs: MacroItemSummary
    fat: MacroItemSummary
    fiber: MacroItemSummary

    model_config = ConfigDict(from_attributes=True)

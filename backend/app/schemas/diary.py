from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateDiaryEntryRequest(BaseModel):
    meal_type: str = Field(..., description="Meal type: breakfast, lunch, evening_snack, dinner, other")
    date: str = Field(..., description="Date YYYY-MM-DD")
    food_id: int = Field(..., ge=1, description="Target food item ID")
    food_portion_id: Optional[int] = Field(None, ge=1, description="Optional food portion ID")
    quantity: float = Field(1.0, gt=0.0, le=50.0, description="Portion multiplier quantity")
    notes: Optional[str] = None


class UpdateDiaryEntryRequest(BaseModel):
    quantity: Optional[float] = Field(None, gt=0.0, le=50.0)
    food_portion_id: Optional[int] = Field(None, ge=1)


class MealEntryResponse(BaseModel):
    id: str  # e.g., "entry-1" or "1"
    raw_id: int
    meal_id: int
    food_id: int
    food_portion_id: Optional[int] = None
    food_name: str
    subtext: str
    serving: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float = 0.0
    category_tag: Optional[str] = None
    quantity: float
    serving_gram: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MealSectionResponse(BaseModel):
    id: str  # 'breakfast', 'lunch', 'evening_snack', 'dinner', 'other'
    name: str
    time: str
    subtitle: str
    icon_name: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float = 0.0
    items: List[MealEntryResponse]


class DailyDiaryResponse(BaseModel):
    date: str
    grand_total_calories: float
    grand_total_protein: float
    grand_total_carbs: float
    grand_total_fat: float
    grand_total_fiber: float = 0.0
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    target_fiber: float = 30.0
    caloric_status_text: str
    meals: List[MealSectionResponse]

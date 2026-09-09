from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RecipeIngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    subtext: Optional[str] = Field(None, max_length=255)
    batch_measure: str = Field(..., min_length=1, max_length=100)
    calories: float = Field(..., ge=0.0)
    protein_g: float = Field(..., ge=0.0)
    carbs_g: float = Field(..., ge=0.0)
    fat_g: float = Field(..., ge=0.0)
    fiber_g: float = Field(0.0, ge=0.0)
    food_id: Optional[int] = None


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientResponse(RecipeIngredientBase):
    id: int
    recipe_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecipeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    servings: int = Field(1, ge=1)
    portion_weight_grams: Optional[float] = Field(None, ge=0.0)
    prep_time_minutes: int = Field(15, ge=1)
    image_url: Optional[str] = Field(None, max_length=500)


class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    portion_weight_grams: Optional[float] = Field(None, ge=0.0)
    prep_time_minutes: Optional[int] = Field(None, ge=1)
    image_url: Optional[str] = Field(None, max_length=500)
    ingredients: Optional[List[RecipeIngredientCreate]] = None


class RecipeResponse(RecipeBase):
    id: int
    user_id: int
    batch_calories: float
    batch_protein: float
    batch_carbs: float
    batch_fat: float
    batch_fiber: float
    calories_per_serving: float
    protein_per_serving: float
    carbs_per_serving: float
    fat_per_serving: float
    fiber_per_serving: float
    created_at: datetime
    updated_at: datetime
    ingredients: List[RecipeIngredientResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RecipeLogToMealRequest(BaseModel):
    meal_type: str = Field(..., pattern="^(breakfast|lunch|evening_snack|dinner|other)$")
    consumed_at: datetime
    servings_logged: float = Field(1.0, ge=0.1, le=100.0)

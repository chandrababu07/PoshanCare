from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field


class FoodPortionResponse(BaseModel):
    id: int
    food_id: int
    portion_name: str
    gram_weight: float
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateCustomFoodRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Food name")
    alternate_name: Optional[str] = Field(None, max_length=255, description="Alternate or regional name")
    description: Optional[str] = Field(None, description="Optional food description")
    category: str = Field("Custom", max_length=100, description="Food category")
    region: str = Field("Custom", max_length=100, description="Cuisine or regional origin")
    is_vegetarian: bool = Field(True, description="Vegetarian indicator")
    serving_size_name: str = Field("1 serving", max_length=100, description="Serving unit name e.g. 1 cup")
    serving_size_g: float = Field(..., gt=0, description="Serving weight in grams (must be > 0)")
    calories: float = Field(..., ge=0, description="Calories (kcal, must be >= 0)")
    protein_g: float = Field(0.0, ge=0, description="Protein in grams (must be >= 0)")
    carbs_g: float = Field(0.0, ge=0, description="Carbohydrates in grams (must be >= 0)")
    fat_g: float = Field(0.0, ge=0, description="Fat in grams (must be >= 0)")
    fiber_g: float = Field(0.0, ge=0, description="Fiber in grams (must be >= 0)")
    sugar_g: float = Field(0.0, ge=0, description="Sugar in grams (must be >= 0)")
    sodium_mg: float = Field(0.0, ge=0, description="Sodium in milligrams (must be >= 0)")


class FoodResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    ifct_code: Optional[str] = None
    name: str
    alternate_name: Optional[str] = None
    description: Optional[str] = None
    category: str
    region: str
    is_vegetarian: bool = True
    image_url: Optional[str] = None
    serving_size_name: str
    serving_size_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0
    source: str = "system"
    is_verified: bool = True
    is_custom: bool = False
    is_favorite: bool = False
    portions: List[FoodPortionResponse] = []
    created_at: datetime
    updated_at: datetime

    @computed_field
    def calories_per_100g(self) -> float:
        if self.serving_size_g <= 0:
            return 0.0
        return round((self.calories / self.serving_size_g) * 100.0, 1)

    model_config = ConfigDict(from_attributes=True)


class PaginatedFoodResponse(BaseModel):
    items: List[FoodResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FavoriteFoodResponse(BaseModel):
    id: int
    user_id: int
    food_id: int
    created_at: datetime
    food: Optional[FoodResponse] = None

    model_config = ConfigDict(from_attributes=True)

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


class FoodResponse(BaseModel):
    id: int
    ifct_code: Optional[str] = None
    name: str
    alternate_name: Optional[str] = None
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

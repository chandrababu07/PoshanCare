from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateWaterLogRequest(BaseModel):
    date: str = Field(..., description="Target date YYYY-MM-DD")
    amount_ml: int = Field(..., gt=0, le=5000, description="Volume of water consumed in milliliters")
    note: Optional[str] = Field(None, max_length=255, description="Optional note")


class WaterLogResponse(BaseModel):
    id: str  # e.g. "w-1"
    raw_id: int
    user_id: int
    date: str
    amount_ml: int
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HydrationDailyResponse(BaseModel):
    date: str
    total_water_ml: int
    target_water_ml: int = 2500
    has_data: bool
    logs: List[WaterLogResponse]

    model_config = ConfigDict(from_attributes=True)

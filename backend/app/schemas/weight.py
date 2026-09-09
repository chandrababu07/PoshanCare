from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateWeightLogRequest(BaseModel):
    date: str = Field(..., description="Target date YYYY-MM-DD")
    weight_kg: float = Field(..., gt=20.0, le=300.0, description="Body weight in kilograms")
    note: Optional[str] = Field(None, max_length=255, description="Optional measurement notes")


class WeightLogResponse(BaseModel):
    id: str  # e.g., "w-1"
    raw_id: int
    user_id: int
    date: str
    weight_kg: float
    moving_average: float
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeightSummaryResponse(BaseModel):
    current_weight: float
    target_weight: float
    start_weight: float
    net_change: float
    weekly_velocity: float
    progress_pct: float
    days_tracked: int
    logs: List[WeightLogResponse]

    model_config = ConfigDict(from_attributes=True)

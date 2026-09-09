from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class UpsertActivityLogRequest(BaseModel):
    date: str = Field(..., description="Target date YYYY-MM-DD")
    activity_level: Optional[str] = Field(None, description="Activity level: Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active")
    steps: Optional[int] = Field(None, ge=0, le=200000, description="Daily step count")
    active_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Active movement duration in minutes")
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Dedicated exercise duration in minutes")
    activity_type: Optional[str] = Field(None, max_length=100, description="Primary activity type e.g. Walking, Yoga")
    notes: Optional[str] = Field(None, max_length=255, description="Optional notes")


class ActivityLogResponse(BaseModel):
    id: str  # e.g. "act-1"
    raw_id: int
    user_id: int
    date: str
    activity_level: Optional[str] = None
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    exercise_minutes: Optional[int] = None
    activity_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityDailyResponse(BaseModel):
    date: str
    has_activity_data: bool
    log: Optional[ActivityLogResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ActivityHistoryResponse(BaseModel):
    period: str
    days_in_period: int
    logged_days_count: int
    avg_steps: Optional[float] = None
    total_steps: int = 0
    logs: List[ActivityLogResponse]

    model_config = ConfigDict(from_attributes=True)

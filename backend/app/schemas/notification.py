from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    notification_type: str = Field(
        ...,
        description="Type: 'hydration' | 'nutrition' | 'activity' | 'goal' | 'meal_plan' | 'consistency' | 'weight' | 'system'",
    )
    severity: str = Field(
        "info",
        description="Severity: 'info' | 'low' | 'medium' | 'high'",
    )
    title: str = Field(..., max_length=255)
    message: str
    action: Optional[str] = Field(
        None,
        description="Action key: e.g. 'log_water', 'view_meal_plan', 'track_activity', 'view_goals', 'open_meal_plan', 'log_food'",
    )
    source: str = Field(..., max_length=100)
    metadata_json: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total_count: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    count: int


class NotificationGenerateResponse(BaseModel):
    generated_count: int
    notifications: List[NotificationResponse]
    message: str

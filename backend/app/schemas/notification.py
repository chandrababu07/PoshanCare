from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    notification_type: str = Field(
        ...,
        description="Type: 'hydration' | 'nutrition' | 'activity' | 'goal' | 'meal_plan' | 'consistency' | 'weight' | 'weekly_summary' | 'system'",
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


class NotificationPreferenceUpdate(BaseModel):
    meal_reminders_enabled: Optional[bool] = None
    meal_reminder_time: Optional[str] = None
    hydration_reminders_enabled: Optional[bool] = None
    hydration_reminder_frequency_hours: Optional[int] = None
    activity_reminders_enabled: Optional[bool] = None
    weight_reminders_enabled: Optional[bool] = None
    goal_updates_enabled: Optional[bool] = None
    weekly_summary_enabled: Optional[bool] = None
    insights_enabled: Optional[bool] = None


class NotificationPreferenceResponse(BaseModel):
    user_id: int
    meal_reminders_enabled: bool
    meal_reminder_time: str
    hydration_reminders_enabled: bool
    hydration_reminder_frequency_hours: int
    activity_reminders_enabled: bool
    weight_reminders_enabled: bool
    goal_updates_enabled: bool
    weekly_summary_enabled: bool
    insights_enabled: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RecordCountsSchema(BaseModel):
    """Counts of health records owned by user."""

    meals: int = 0
    custom_foods: int = 0
    favorite_foods: int = 0
    weight_logs: int = 0
    hydration_logs: int = 0
    activity_logs: int = 0
    health_goals: int = 0
    meal_plans: int = 0
    recipes: int = 0
    clinical_reports: int = 0


class AccountSummaryResponse(BaseModel):
    """Sanitized account summary metrics returned for privacy dashboard."""

    email: str
    full_name: str
    created_at: datetime
    auth_provider: str = "email"
    profile_type: Optional[str] = "adult"
    record_counts: RecordCountsSchema
    last_activity_at: Optional[datetime] = None


class UserExportSchema(BaseModel):
    """Sanitized user identity schema for export (excluding passwords & secrets)."""

    id: int
    email: str
    full_name: str
    auth_provider: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class HealthDataExportResponse(BaseModel):
    """Structured export payload of user health data."""

    export_version: str = "1.0"
    generated_at: datetime
    user: UserExportSchema
    profile: Optional[Dict[str, Any]] = None
    meals: List[Dict[str, Any]] = Field(default_factory=list)
    custom_foods: List[Dict[str, Any]] = Field(default_factory=list)
    favorite_foods: List[Dict[str, Any]] = Field(default_factory=list)
    recipes: List[Dict[str, Any]] = Field(default_factory=list)
    weight_logs: List[Dict[str, Any]] = Field(default_factory=list)
    hydration_logs: List[Dict[str, Any]] = Field(default_factory=list)
    activity_logs: List[Dict[str, Any]] = Field(default_factory=list)
    goals: List[Dict[str, Any]] = Field(default_factory=list)
    meal_plans: List[Dict[str, Any]] = Field(default_factory=list)
    clinical_reports: List[Dict[str, Any]] = Field(default_factory=list)
    notifications: List[Dict[str, Any]] = Field(default_factory=list)


class AccountDeleteResponse(BaseModel):
    """Account deletion confirmation schema."""

    status: str = "success"
    message: str = "Account and associated personal health data permanently deleted."

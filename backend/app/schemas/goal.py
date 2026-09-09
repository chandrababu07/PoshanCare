from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class GoalCreateRequest(BaseModel):
    """Payload for creating a personal health goal."""

    goal_type: str = Field(
        ...,
        description="Goal type ('nutrition' | 'hydration' | 'activity' | 'weight_tracking' | 'meal_consistency' | 'protein' | 'custom')",
    )
    title: str = Field(..., max_length=200, description="Title of the health goal")
    description: Optional[str] = Field(None, max_length=500, description="Optional detail/note")
    target_value: float = Field(..., gt=0, description="Numerical target value")
    unit: str = Field(..., max_length=50, description="Unit of measurement (e.g., 'ml', 'min', 'g', 'days/week')")
    frequency: str = Field("daily", description="Frequency ('daily' | 'weekly' | 'monthly' | 'ongoing')")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD), defaults to today")
    target_date: Optional[str] = Field(None, description="Target completion date (YYYY-MM-DD)")


class GoalUpdateRequest(BaseModel):
    """Payload for updating an existing health goal."""

    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    target_value: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=50)
    frequency: Optional[str] = Field(None)
    target_date: Optional[str] = Field(None)
    status: Optional[str] = Field(None, description="'active' | 'completed' | 'paused' | 'archived'")


class GoalResponse(BaseModel):
    """Response representation of a health goal."""

    id: int
    user_id: int
    goal_type: str
    title: str
    description: Optional[str] = None
    target_value: float
    unit: str
    frequency: str
    start_date: str
    target_date: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalProgressResponse(BaseModel):
    """Detailed real-data progress evaluation for a single goal."""

    goal: GoalResponse
    current_value: Optional[float] = None
    target_value: float
    progress_percentage: Optional[float] = None
    unit: str
    has_data: bool
    data_quality: str  # 'sufficient_data' | 'partial_data' | 'insufficient_data' | 'no_data'
    message: str
    period_start: str
    period_end: str

    model_config = ConfigDict(from_attributes=True)


class CoachingInsightResponse(BaseModel):
    """Explainable adaptive coaching guidance item."""

    id: str
    category: str  # 'nutrition' | 'hydration' | 'activity' | 'weight' | 'consistency' | 'general'
    priority: str  # 'high' | 'medium' | 'low'
    title: str
    message: str
    suggested_action: Optional[str] = None
    suggested_route: Optional[str] = None
    metric_context: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class GoalDashboardResponse(BaseModel):
    """Aggregated goals and coaching overview."""

    active_goals: List[GoalProgressResponse]
    completed_goals_count: int
    total_goals_count: int
    coaching_insights: List[CoachingInsightResponse]
    data_quality_summary: str
    persona: str

    model_config = ConfigDict(from_attributes=True)

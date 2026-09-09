from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class DataAvailability(BaseModel):
    has_nutrition_data: bool
    has_hydration_data: bool
    has_activity_data: bool
    has_weight_data: bool
    has_goal_data: bool
    has_meal_plan_data: bool


class CategorySummaryItem(BaseModel):
    logged_days: int
    avg_value: Optional[float] = None
    target_value: Optional[float] = None
    unit: str
    consistency_pct: float


class HealthInsightsSummary(BaseModel):
    nutrition: CategorySummaryItem
    hydration: CategorySummaryItem
    activity: CategorySummaryItem
    weight: Dict[str, Optional[float]]
    goals: Dict[str, int]


class TrendAnalysisPoint(BaseModel):
    date: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    water_ml: Optional[int] = None
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    weight_kg: Optional[float] = None


class TrendAnalysisSeries(BaseModel):
    metric: str
    status: str  # "improving" | "stable" | "declining" | "insufficient_data"
    change_pct: Optional[float] = None
    message: str


class CorrelationInsight(BaseModel):
    id: str
    variables: List[str]
    title: str
    observation: str
    strength: str  # "strong" | "moderate" | "weak" | "insufficient_data"
    overlapping_days: int
    is_statistically_valid: bool


class RuleBasedInsight(BaseModel):
    id: str
    category: str  # "nutrition" | "hydration" | "activity" | "weight" | "goals" | "consistency" | "meal_planning"
    priority: str  # "low" | "medium" | "high"
    title: str
    message: str
    evidence: str
    action: str
    data_available: bool


class PrioritizedAction(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str  # "low" | "medium" | "high"
    route: str


class HealthInsightsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    period: str
    persona: str
    data_availability: DataAvailability
    summary: HealthInsightsSummary
    trend_points: List[TrendAnalysisPoint]
    trends: List[TrendAnalysisSeries]
    insights: List[RuleBasedInsight]
    actions: List[PrioritizedAction]
    correlations: List[CorrelationInsight]

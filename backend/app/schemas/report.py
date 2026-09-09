from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WeeklyCalorieItem(BaseModel):
    day: str
    value: int
    label: str


class ClinicalReportMetricsResponse(BaseModel):
    documentId: str
    issueDate: str
    patientName: str
    demographics: str
    bodyMass: str
    massDelta: str
    targetMass: str
    avg7DayCalories: int
    caloricAdherencePct: float
    proteinVelocity: float
    targetProtein: int
    proteinPct: int
    electrolyteStatus: str
    micronutrientSufficiency: int
    rdasMet: str
    weeklyCalorieHistory: List[WeeklyCalorieItem]
    icmrTargetLine: int
    hydrationSummary: str = "0 ml"
    activitySummary: str = "0 mins"
    profileType: str = "adult"
    loggedDays: int = 0
    hasRealData: bool = False

    model_config = ConfigDict(from_attributes=True)


class GenerateReportRequest(BaseModel):
    report_type: str = Field("7day", pattern="^(7day|30day|custom)$")
    attach_letterhead: bool = True
    anonymize: bool = False
    custom_start_date: Optional[str] = None
    custom_end_date: Optional[str] = None


class ClinicalReportSummaryResponse(BaseModel):
    id: int
    document_id: str
    report_type: str
    attach_letterhead: bool
    anonymize: bool
    avg_7day_calories: float
    caloric_adherence_pct: float
    protein_velocity_g: float
    target_protein_g: float
    protein_pct: float
    micronutrient_sufficiency_pct: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

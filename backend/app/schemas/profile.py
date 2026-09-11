from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


VALID_PROFILE_TYPES = {"child", "teen", "adult", "older_adult", "family"}
VALID_LANGUAGES = {"en", "te", "hi"}
VALID_DIET_TYPES = {"vegetarian", "eggetarian", "non_vegetarian", "vegan", "other"}
VALID_SEXES = {"female", "male", "unspecified"}
VALID_UNITS = {"metric", "imperial"}
VALID_COMPOSITION_INTENTS = {"standard", "custom"}
VALID_LEAN_MASS_FOCUS = {"none", "lean_gain", "sarcopenia_prevent", "recomp"}
VALID_GOALS = {
    "muscle",
    "maintain",
    "improve",
    "fat-loss",
    "eat_healthier",
    "build_strength",
    "fitness",
    "wellness",
    "daily_nutrition",
    "family_nutrition",
}
VALID_PACES = {"gradual", "moderate"}
VALID_ACTIVITY_LEVELS = {
    "Sedentary",
    "Lightly Active",
    "Moderately Active",
    "Very Active",
    "Extremely Active",
    "Mostly Inactive",
}


class UserProfileUpdate(BaseModel):
    """Schema for progressive partial updates (PATCH) of user profile & onboarding data."""

    onboarding_step: Optional[int] = Field(None, ge=0, le=11)

    # Identity / Demographic & Persona
    profile_type: Optional[str] = Field(None)
    date_of_birth: Optional[str] = Field(None)
    country: Optional[str] = Field(None)
    region: Optional[str] = Field(None)
    preferred_language: Optional[str] = Field(None)
    timezone: Optional[str] = Field(None)
    age: Optional[int] = Field(None, ge=1, le=120)
    biological_sex: Optional[str] = Field(None)

    # Food & Meal Preferences
    diet_type: Optional[str] = Field(None)
    food_preferences: Optional[List[str]] = Field(None)
    food_avoidances: Optional[List[str]] = Field(None)
    meal_frequency: Optional[str] = Field(None)
    meal_timings: Optional[Dict[str, Any]] = Field(None)
    health_conditions: Optional[List[str]] = Field(None)

    # Body Metrics
    unit_system: Optional[str] = Field(None)
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=5.0, le=300.0)
    target_mass_kg: Optional[float] = Field(None, ge=5.0, le=300.0)
    composition_intent: Optional[str] = Field(None)
    lean_mass_focus: Optional[str] = Field(None)

    # Goals
    primary_goal: Optional[str] = Field(None)
    progression_pace: Optional[str] = Field(None)

    # Activity Profile
    activity_level: Optional[str] = Field(None)
    routines: Optional[List[str]] = Field(None)
    training_frequency: Optional[str] = Field(None)
    daily_steps: Optional[int] = Field(None, ge=0, le=100000)

    @field_validator("profile_type")
    @classmethod
    def validate_profile_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PROFILE_TYPES:
            allowed = ", ".join(sorted(VALID_PROFILE_TYPES))
            raise ValueError(f"Invalid profile type. Allowed values: {allowed}")
        return v

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_LANGUAGES:
            allowed = ", ".join(sorted(VALID_LANGUAGES))
            raise ValueError(f"Invalid preferred language. Allowed values: {allowed}")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if not v_clean or len(v_clean) > 50:
                raise ValueError("Invalid timezone string.")
            return v_clean
        return v

    @field_validator("diet_type")
    @classmethod
    def validate_diet(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_DIET_TYPES:
            allowed = ", ".join(sorted(VALID_DIET_TYPES))
            raise ValueError(f"Invalid diet type. Allowed values: {allowed}")
        return v

    @field_validator("biological_sex")
    @classmethod
    def validate_sex(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_SEXES:
            allowed = ", ".join(sorted(VALID_SEXES))
            raise ValueError(f"Invalid biological sex. Allowed values: {allowed}")
        return v

    @field_validator("unit_system")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_UNITS:
            allowed = ", ".join(sorted(VALID_UNITS))
            raise ValueError(f"Invalid unit system. Allowed values: {allowed}")
        return v

    @field_validator("composition_intent")
    @classmethod
    def validate_intent(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_COMPOSITION_INTENTS:
            allowed = ", ".join(sorted(VALID_COMPOSITION_INTENTS))
            raise ValueError(f"Invalid composition intent. Allowed values: {allowed}")
        return v

    @field_validator("lean_mass_focus")
    @classmethod
    def validate_lean_focus(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_LEAN_MASS_FOCUS:
            allowed = ", ".join(sorted(VALID_LEAN_MASS_FOCUS))
            raise ValueError(f"Invalid lean mass focus. Allowed values: {allowed}")
        return v

    @field_validator("primary_goal")
    @classmethod
    def validate_goal(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_GOALS:
            allowed = ", ".join(sorted(VALID_GOALS))
            raise ValueError(f"Invalid primary goal. Allowed values: {allowed}")
        return v

    @field_validator("progression_pace")
    @classmethod
    def validate_pace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PACES:
            allowed = ", ".join(sorted(VALID_PACES))
            raise ValueError(f"Invalid progression pace. Allowed values: {allowed}")
        return v

    @field_validator("activity_level")
    @classmethod
    def validate_activity(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_ACTIVITY_LEVELS:
            allowed = ", ".join(sorted(VALID_ACTIVITY_LEVELS))
            raise ValueError(f"Invalid activity level. Allowed values: {allowed}")
        return v


class UserProfileResponse(BaseModel):
    """Full user profile and onboarding response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    onboarding_step: int
    onboarding_completed: bool

    # Persona & Demographics
    profile_type: Optional[str] = "adult"
    date_of_birth: Optional[str] = None
    country: Optional[str] = "India"
    region: Optional[str] = None
    preferred_language: Optional[str] = "en"
    timezone: Optional[str] = "Asia/Kolkata"
    age: Optional[int] = None
    biological_sex: Optional[str] = "female"

    # Food & Meal Preferences
    diet_type: Optional[str] = "vegetarian"
    food_preferences: Optional[List[str]] = None
    food_avoidances: Optional[List[str]] = None
    meal_frequency: Optional[str] = None
    meal_timings: Optional[Dict[str, Any]] = None
    health_conditions: Optional[List[str]] = None

    # Body Metrics (Canonical Metric Units)
    unit_system: Optional[str] = "metric"
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_mass_kg: Optional[float] = None
    composition_intent: Optional[str] = "standard"
    lean_mass_focus: Optional[str] = "none"

    # Goals
    primary_goal: Optional[str] = "maintain"
    progression_pace: Optional[str] = "gradual"

    # Activity Profile
    activity_level: Optional[str] = "Moderately Active"
    routines: Optional[List[str]] = None
    training_frequency: Optional[str] = "3–4 days/week"
    daily_steps: Optional[int] = 8000

    # Timestamps
    created_at: datetime
    updated_at: datetime


class OnboardingStatusResponse(BaseModel):
    """Response schema for GET /api/v1/profile/onboarding/status."""

    onboarding_completed: bool
    onboarding_step: int
    next_step: str
    is_ready_to_complete: bool


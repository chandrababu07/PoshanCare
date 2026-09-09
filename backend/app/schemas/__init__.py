"""Pydantic validation schemas package."""
from app.schemas.health import HealthResponse, DatabaseHealthResponse
from app.schemas.auth import UserRegister, UserLogin, UserResponse, AuthResponse
from app.schemas.profile import (
    UserProfileUpdate,
    UserProfileResponse,
    OnboardingStatusResponse,
)
from app.schemas.food import (
    FoodPortionResponse,
    FoodResponse,
    PaginatedFoodResponse,
)
from app.schemas.diary import (
    CreateDiaryEntryRequest,
    UpdateDiaryEntryRequest,
    MealEntryResponse,
    MealSectionResponse,
    DailyDiaryResponse,
)

__all__ = [
    "HealthResponse",
    "DatabaseHealthResponse",
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "AuthResponse",
    "UserProfileUpdate",
    "UserProfileResponse",
    "OnboardingStatusResponse",
    "FoodPortionResponse",
    "FoodResponse",
    "PaginatedFoodResponse",
    "CreateDiaryEntryRequest",
    "UpdateDiaryEntryRequest",
    "MealEntryResponse",
    "MealSectionResponse",
    "DailyDiaryResponse",
]

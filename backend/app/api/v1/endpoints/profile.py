from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import (
    OnboardingStatusResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.profile import (
    complete_user_onboarding,
    compute_onboarding_status,
    get_or_create_user_profile,
    update_user_profile,
)

router = APIRouter(prefix="/profile", tags=["User Profile & Onboarding"])


@router.get(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile & onboarding data",
)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Retrieve or initialize the authenticated user's profile and onboarding state."""
    profile = await get_or_create_user_profile(db, current_user.id)
    return UserProfileResponse.model_validate(profile)


@router.get(
    "/onboarding/status",
    response_model=OnboardingStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get onboarding status, current step, and next route",
)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingStatusResponse:
    """Retrieve current onboarding completion status, step integer (0-6), and next navigation route."""
    profile = await get_or_create_user_profile(db, current_user.id)
    return compute_onboarding_status(profile)


@router.patch(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially update user profile & progressive onboarding step data",
)
async def patch_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Accept partial profile updates, validate field constraints, and save progressive changes."""
    profile = await update_user_profile(db, current_user.id, profile_in)
    return UserProfileResponse.model_validate(profile)


@router.post(
    "/onboarding/complete",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Finalize and mark onboarding as complete",
)
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    """Validate all required onboarding entries server-side and mark onboarding as complete."""
    profile = await complete_user_onboarding(db, current_user.id)
    return UserProfileResponse.model_validate(profile)

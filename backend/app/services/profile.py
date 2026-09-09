from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import PoshanCareException
from app.core.logging import logger
from app.models.profile import UserProfile
from app.schemas.profile import OnboardingStatusResponse, UserProfileUpdate


async def get_or_create_user_profile(
    db: AsyncSession, user_id: int
) -> UserProfile:
    """Retrieve existing user profile or initialize a new blank profile race-safely."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        try:
            profile = UserProfile(
                user_id=user_id,
                onboarding_step=0,
                onboarding_completed=False,
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            logger.info(f"Initialized new UserProfile for user_id={user_id}")
        except IntegrityError:
            await db.rollback()
            # Retry fetching after concurrent race condition initialization
            result = await db.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = result.scalar_one()

    return profile


def is_profile_ready_for_completion(profile: UserProfile) -> Tuple[bool, list[str]]:
    """Check if all required onboarding fields are present for completion."""
    missing = []
    # Age or DOB check
    if (profile.age is None or profile.age < 1) and not profile.date_of_birth:
        missing.append("age_or_dob")
    if not profile.biological_sex:
        missing.append("biological_sex")
    if profile.height_cm is None or profile.height_cm < 30.0:
        missing.append("height_cm")
    if profile.weight_kg is None or profile.weight_kg < 5.0:
        missing.append("weight_kg")
    if not profile.primary_goal:
        missing.append("primary_goal")
    if not profile.activity_level:
        missing.append("activity_level")

    return (len(missing) == 0, missing)


def compute_onboarding_status(profile: UserProfile) -> OnboardingStatusResponse:
    """Compute explicit onboarding status and next navigation step."""
    is_ready, _ = is_profile_ready_for_completion(profile)

    if profile.onboarding_completed or profile.onboarding_step >= 11:
        next_step = "/app"
    elif profile.onboarding_step == 1:
        next_step = "/onboarding/profile"
    elif profile.onboarding_step == 2:
        next_step = "/onboarding/body-metrics"
    elif profile.onboarding_step == 3:
        next_step = "/onboarding/activity"
    elif profile.onboarding_step == 4:
        next_step = "/onboarding/goals"
    elif profile.onboarding_step == 5:
        next_step = "/onboarding/diet-preferences"
    elif profile.onboarding_step == 6:
        next_step = "/onboarding/meal-habits"
    elif profile.onboarding_step == 7:
        next_step = "/onboarding/health-context"
    elif profile.onboarding_step >= 8:
        next_step = "/onboarding/review"
    else:
        next_step = "/onboarding"

    return OnboardingStatusResponse(
        onboarding_completed=profile.onboarding_completed,
        onboarding_step=profile.onboarding_step,
        next_step=next_step,
        is_ready_to_complete=is_ready,
    )


async def update_user_profile(
    db: AsyncSession, user_id: int, profile_in: UserProfileUpdate
) -> UserProfile:
    """Partially update user profile attributes (PATCH)."""
    profile = await get_or_create_user_profile(db, user_id)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    logger.debug(f"Updated UserProfile for user_id={user_id}: {update_data.keys()}")
    return profile


async def complete_user_onboarding(
    db: AsyncSession, user_id: int
) -> UserProfile:
    """Validate all required onboarding inputs server-side and finalize completion status."""
    profile = await get_or_create_user_profile(db, user_id)

    is_ready, missing_fields = is_profile_ready_for_completion(profile)
    if not is_ready:
        raise PoshanCareException(
            message=f"Incomplete onboarding parameters. Missing required fields: {', '.join(missing_fields)}",
            code="INCOMPLETE_ONBOARDING",
            status_code=400,
            details={"missing_fields": missing_fields},
        )

    profile.onboarding_completed = True
    profile.onboarding_step = 11
    await db.commit()
    await db.refresh(profile)
    logger.info(f"Onboarding marked COMPLETED for user_id={user_id}")
    return profile

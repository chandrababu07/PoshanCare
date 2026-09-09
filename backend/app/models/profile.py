from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserProfile(Base):
    """User profile and baseline onboarding measurements table."""

    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Onboarding Progress Status (0: Not started, 1: Profile, 2: Metrics, 3: Goals, 4: Activity, 5: Review, 6: Completed)
    onboarding_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Identity / Demographic Profile
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    biological_sex: Mapped[Optional[str]] = mapped_column(
        String(20), default="female", nullable=True
    )  # 'female' | 'male' | 'unspecified'

    # Body Metrics (Canonical metric storage in centimeters & kilograms)
    unit_system: Mapped[Optional[str]] = mapped_column(
        String(20), default="metric", nullable=True
    )  # 'metric' | 'imperial'
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_mass_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    composition_intent: Mapped[Optional[str]] = mapped_column(
        String(20), default="standard", nullable=True
    )  # 'standard' | 'custom'
    lean_mass_focus: Mapped[Optional[str]] = mapped_column(
        String(50), default="none", nullable=True
    )  # 'none' | 'lean_gain' | 'sarcopenia_prevent' | 'recomp'

    # Goals Profile
    primary_goal: Mapped[Optional[str]] = mapped_column(
        String(50), default="maintain", nullable=True
    )  # 'muscle' | 'maintain' | 'improve' | 'fat-loss'
    progression_pace: Mapped[Optional[str]] = mapped_column(
        String(50), default="gradual", nullable=True
    )  # 'gradual' | 'moderate'

    # Activity Profile
    activity_level: Mapped[Optional[str]] = mapped_column(
        String(50), default="Moderately Active", nullable=True
    )  # 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active'
    routines: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    training_frequency: Mapped[Optional[str]] = mapped_column(
        String(50), default="3–4 days/week", nullable=True
    )
    daily_steps: Mapped[Optional[int]] = mapped_column(
        Integer, default=8000, nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")

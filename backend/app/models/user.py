from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import UserSession
    from app.models.profile import UserProfile
    from app.models.diary import Meal
    from app.models.weight import WeightLog
    from app.models.recipe import Recipe
    from app.models.report import ClinicalReport
    from app.models.hydration import WaterLog
    from app.models.activity import ActivityLog
    from app.models.goal import HealthGoal
    from app.models.notification import HealthNotification


class User(Base):
    """User account model for PoshanCare authentication."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_sub: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    auth_provider: Mapped[str] = mapped_column(
        String(50), default="email", nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )
    meals: Mapped[List["Meal"]] = relationship(
        "Meal", back_populates="user", cascade="all, delete-orphan"
    )
    weight_logs: Mapped[List["WeightLog"]] = relationship(
        "WeightLog", back_populates="user", cascade="all, delete-orphan"
    )
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe", back_populates="user", cascade="all, delete-orphan"
    )
    reports: Mapped[List["ClinicalReport"]] = relationship(
        "ClinicalReport", back_populates="user", cascade="all, delete-orphan"
    )
    water_logs: Mapped[List["WaterLog"]] = relationship(
        "WaterLog", back_populates="user", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["ActivityLog"]] = relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan"
    )
    health_goals: Mapped[List["HealthGoal"]] = relationship(
        "HealthGoal", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["HealthNotification"]] = relationship(
        "HealthNotification", back_populates="user", cascade="all, delete-orphan"
    )



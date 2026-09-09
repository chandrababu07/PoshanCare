from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class HealthGoal(Base):
    """Personal health goals table for PoshanCare users."""

    __tablename__ = "health_goals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Goal Specifications
    goal_type: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )  # 'nutrition' | 'hydration' | 'activity' | 'weight_tracking' | 'meal_consistency' | 'protein' | 'custom'
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # 'ml' | 'min' | 'g' | 'days/week' | 'logs/week' | 'kcal' | 'count'
    frequency: Mapped[str] = mapped_column(
        String(50), default="daily", nullable=False
    )  # 'daily' | 'weekly' | 'monthly' | 'ongoing'

    # Timeline & Status
    start_date: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD
    target_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(
        String(50), default="active", index=True, nullable=False
    )  # 'active' | 'completed' | 'paused' | 'archived'

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
    user: Mapped["User"] = relationship("User", back_populates="health_goals")

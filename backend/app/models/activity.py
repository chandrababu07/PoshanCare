from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ActivityLog(Base):
    """Daily physical activity, steps, and movement telemetry log model."""

    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    activity_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active'
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    exercise_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    activity_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., 'Walking', 'Running', 'Yoga', 'Cycling', 'Gym Workout'
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="activity_logs")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_activity_date"),
    )

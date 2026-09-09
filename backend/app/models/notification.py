from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class HealthNotification(Base):
    """Personalized health notifications and alerts table for PoshanCare users."""

    __tablename__ = "health_notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Notification Classification
    notification_type: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )  # 'hydration' | 'nutrition' | 'activity' | 'goal' | 'meal_plan' | 'consistency' | 'weight' | 'system'
    severity: Mapped[str] = mapped_column(
        String(20), default="info", nullable=False
    )  # 'info' | 'low' | 'medium' | 'high'

    # Content & Actionable Target
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # e.g., 'log_water', 'view_meal_plan', 'track_activity', 'view_goals', 'open_meal_plan', 'log_food'
    source: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # e.g., 'hydration_gap', 'protein_deficit', 'activity_gap', 'goal_milestone', 'unlogged_meal_plan', 'logging_streak'

    # Status & Telemetry Metadata
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

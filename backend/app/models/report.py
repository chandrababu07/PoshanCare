from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ClinicalReport(Base):
    """Clinical Nutrition Report audit record model."""

    __tablename__ = "clinical_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False, default="7day")
    attach_letterhead: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    anonymize: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    avg_7day_calories: Mapped[float] = mapped_column(Float, nullable=False)
    caloric_adherence_pct: Mapped[float] = mapped_column(Float, nullable=False)
    protein_velocity_g: Mapped[float] = mapped_column(Float, nullable=False)
    target_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    protein_pct: Mapped[float] = mapped_column(Float, nullable=False)
    micronutrient_sufficiency_pct: Mapped[float] = mapped_column(Float, nullable=False, default=94.0)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reports")

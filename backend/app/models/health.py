from datetime import datetime, timezone
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class HealthCheckRecord(Base):
    """Infrastructure model to verify database connectivity and migration integrity."""

    __tablename__ = "health_check_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="healthy")
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

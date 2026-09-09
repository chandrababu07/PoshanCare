from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, completed, archived
    persona: Mapped[str] = mapped_column(String(50), default="adult", nullable=False)

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
    user: Mapped["User"] = relationship("User")
    items: Mapped[List["MealPlanItem"]] = relationship(
        "MealPlanItem",
        back_populates="meal_plan",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("user_id", "plan_date", name="uq_user_meal_plan_date"),
    )


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    meal_plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # breakfast, lunch, dinner, snack
    food_id: Mapped[int] = mapped_column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True)
    servings: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    suggested_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    meal_plan: Mapped["MealPlan"] = relationship("MealPlan", back_populates="items")
    food: Mapped["Food"] = relationship("Food", lazy="selectin")

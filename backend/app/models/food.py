from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    ifct_code: Mapped[Optional[str]] = mapped_column(String(32), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    alternate_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    region: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    is_vegetarian: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Standard reference serving metrics
    serving_size_name: Mapped[str] = mapped_column(String(100), nullable=False)
    serving_size_g: Mapped[float] = mapped_column(Float, nullable=False)
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False)
    fiber_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

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
    portions: Mapped[List["FoodPortion"]] = relationship(
        "FoodPortion",
        back_populates="food",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class FoodPortion(Base):
    __tablename__ = "food_portions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    food_id: Mapped[int] = mapped_column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True)
    portion_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gram_weight: Mapped[float] = mapped_column(Float, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    food: Mapped["Food"] = relationship("Food", back_populates="portions")

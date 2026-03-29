"""
models.py
---------
Database table definitions (called "models" in SQLAlchemy).
Each Python class here becomes one table in the SQLite file.
"""

from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey, Float
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    """Stores login credentials for each user."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    onboarding_done: Mapped[bool] = mapped_column(Boolean, default=False)

    clothes: Mapped[list["ClothingItem"]] = relationship("ClothingItem", back_populates="user")
    classes: Mapped[list["ClassSchedule"]] = relationship("ClassSchedule", back_populates="user")


class ClothingItem(Base):
    """
    One row = one piece of clothing.
    location: 'closet' | 'washer' | 'dryer'   ← tracks where the item is right now
    fabric:   'cotton' | 'wool' | 'synthetic'
    category: 'base_layer' | 'top' | 'bottom' | 'outer'
    dryer_setting: 'high' | 'medium' | 'low'
    """
    __tablename__ = "clothing_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)   # base_layer | top | bottom | outer
    fabric: Mapped[str] = mapped_column(String, nullable=False)     # cotton | wool | synthetic
    warmth_score: Mapped[int] = mapped_column(Integer, default=5)   # 1-10
    color: Mapped[str] = mapped_column(String, default="#6B7280")   # hex color for the dot on the card

    # Status flags
    is_clean: Mapped[bool] = mapped_column(Boolean, default=True)
    is_wet: Mapped[bool] = mapped_column(Boolean, default=False)

    # Where the item physically is right now
    location: Mapped[str] = mapped_column(String, default="closet")  # closet | washer | dryer

    # Dryer tracking — set when user moves item to dryer
    dryer_setting: Mapped[str] = mapped_column(String, default="medium")  # high | medium | low
    drying_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="clothes")


class ClassSchedule(Base):
    """One row = one class the user attends."""
    __tablename__ = "class_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    course_name: Mapped[str] = mapped_column(String, nullable=False)
    # ISO 8601 datetime strings stored as text for simplicity
    start_time: Mapped[str] = mapped_column(String, nullable=False)   # e.g. "2024-03-28T10:30:00"
    end_time: Mapped[str] = mapped_column(String, nullable=False)
    travel_minutes: Mapped[int] = mapped_column(Integer, default=60)
    days_of_week: Mapped[str] = mapped_column(String, default="MWF")  # e.g. "MWF" or "TR"

    user: Mapped["User"] = relationship("User", back_populates="classes")

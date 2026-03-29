"""
schemas.py
----------
Pydantic schemas define the shape of data going in and out of the API.
Think of them as TypeScript interfaces but for Python.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from drying_logic import FABRIC_TYPES, DRYER_SETTINGS, CATEGORIES

# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    onboarding_done: bool

    model_config = {"from_attributes": True}

# ── Clothing ──────────────────────────────────────────────────────────────────

class ClothingItemCreate(BaseModel):
    name: str
    category: str          # one of CATEGORIES
    fabric: str            # one of FABRIC_TYPES
    warmth_score: int = 5  # 1-10
    color: str = "#6B7280" # hex color for the dot shown on the card
    is_clean: bool = True
    is_wet: bool = False
    location: str = "closet"       # closet | washer | dryer
    dryer_setting: str = "medium"  # high | medium | low

class ClothingItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    fabric: Optional[str] = None
    warmth_score: Optional[int] = None
    color: Optional[str] = None
    is_clean: Optional[bool] = None
    is_wet: Optional[bool] = None
    location: Optional[str] = None
    dryer_setting: Optional[str] = None
    drying_started_at: Optional[datetime] = None

class ClothingItemOut(BaseModel):
    id: int
    user_id: int
    name: str
    category: str
    fabric: str
    warmth_score: int
    color: str
    is_clean: bool
    is_wet: bool
    location: str
    dryer_setting: str
    drying_started_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

# ── Class Schedule ─────────────────────────────────────────────────────────────

class ClassScheduleCreate(BaseModel):
    course_name: str
    start_time: str    # ISO datetime string, e.g. "2024-03-28T10:30:00"
    end_time: str
    travel_minutes: int = 60
    days_of_week: str = "MWF"

class ClassScheduleOut(BaseModel):
    id: int
    user_id: int
    course_name: str
    start_time: str
    end_time: str
    travel_minutes: int
    days_of_week: str

    model_config = {"from_attributes": True}

# ── Recommendation ─────────────────────────────────────────────────────────────

class RecommendationRequest(BaseModel):
    desired_item_ids: list[int]
    class_id: int

class ItemReadiness(BaseModel):
    item_id: int
    item_name: str
    is_ready: bool
    location: str
    minutes_to_dry: Optional[int] = None
    minutes_remaining: Optional[int] = None
    dry_at: Optional[str] = None
    leave_at: Optional[str] = None

class RecommendationResponse(BaseModel):
    outfit_ready: bool            # True only if ALL desired items are ready
    status_color: str             # "green" | "red"
    status_message: str
    items: list[ItemReadiness]
    weather: dict
    layering: dict
    alternatives: list[ClothingItemOut]  # Dry alternatives if outfit not ready
    leave_at: Optional[str] = None

# ── Dropdown constants (sent to front-end) ─────────────────────────────────────

class AppConstants(BaseModel):
    fabric_types: list[str]
    dryer_settings: list[str]
    categories: list[str]
    fabric_colors: dict[str, str]   # fabric → suggested dot color

APP_CONSTANTS = AppConstants(
    fabric_types=FABRIC_TYPES,
    dryer_settings=DRYER_SETTINGS,
    categories=CATEGORIES,
    fabric_colors={
        "cotton":    "#4B9CD3",   # blue
        "wool":      "#D4A017",   # amber/gold
        "synthetic": "#9B59B6",   # purple
    }
)

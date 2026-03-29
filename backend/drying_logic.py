"""
drying_logic.py
---------------
Pure Python functions to estimate dryer time.
No database access — just math based on fabric + dryer setting.
"""

from datetime import datetime, timedelta


# ---------- Reference table ----------
# Outer key: fabric type
# Inner key: dryer heat setting
# Value: estimated minutes to dry
DRYING_TIMES: dict[str, dict[str, int]] = {
    "cotton": {
        "high":   40,
        "medium": 60,
        "low":    80,
    },
    "wool": {
        "high":   70,
        "medium": 90,   # wool on medium is gentler but slower
        "low":    90,   # always go slow/low for wool
    },
    "synthetic": {
        "high":   25,
        "medium": 35,
        "low":    50,
    },
}

# User-facing labels for the front-end dropdowns (matches keys above)
FABRIC_TYPES = ["cotton", "wool", "synthetic"]
DRYER_SETTINGS = ["high", "medium", "low"]
CATEGORIES = ["base_layer", "top", "bottom", "outer"]


def estimate_dry_time(fabric: str, dryer_setting: str) -> int:
    """
    Returns estimated minutes to dry based on fabric and dryer heat.
    Falls back to 60 minutes if unknown combination.
    """
    fabric = fabric.lower()
    setting = dryer_setting.lower()
    return DRYING_TIMES.get(fabric, {}).get(setting, 60)


def will_be_dry(
    fabric: str,
    dryer_setting: str,
    drying_started_at: datetime | None,
    class_start_str: str,
    travel_minutes: int,
) -> dict:
    """
    Given when drying started and when class begins, determine if the
    item will be ready before the user needs to leave home.

    Returns a dict with:
      - is_ready:           True if the item will be dry in time
      - minutes_to_dry:     Total estimated dry time (minutes)
      - minutes_elapsed:    How many minutes have already passed in the dryer
      - minutes_remaining:  Minutes still needed
      - leave_at:           The datetime the user must leave home
      - dry_at:             The datetime the item will be finished drying
    """
    if drying_started_at is None:
        # Item is wet but not in dryer yet — definitely not ready
        return {
            "is_ready": False,
            "minutes_to_dry": estimate_dry_time(fabric, dryer_setting),
            "minutes_elapsed": 0,
            "minutes_remaining": estimate_dry_time(fabric, dryer_setting),
            "leave_at": None,
            "dry_at": None,
            "error": "Item not yet placed in dryer",
        }

    total_minutes = estimate_dry_time(fabric, dryer_setting)
    now = datetime.now()

    # Parse the ISO class start time
    try:
        class_start = datetime.fromisoformat(class_start_str)
    except Exception:
        return {"is_ready": False, "error": "Invalid class start time format"}

    # When does the user need to walk out the door?
    leave_at = class_start - timedelta(minutes=travel_minutes)

    # When will the dryer finish?
    dry_at = drying_started_at + timedelta(minutes=total_minutes)

    elapsed = max(0, int((now - drying_started_at).total_seconds() / 60))
    remaining = max(0, total_minutes - elapsed)

    return {
        "is_ready": dry_at <= leave_at,
        "minutes_to_dry": total_minutes,
        "minutes_elapsed": elapsed,
        "minutes_remaining": remaining,
        "leave_at": leave_at.isoformat(),
        "dry_at": dry_at.isoformat(),
    }

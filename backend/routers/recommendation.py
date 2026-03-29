"""
routers/recommendation.py
--------------------------
The main logic endpoint: given selected clothes + a class, tell the user:
  1. Will each wet item be dry in time?
  2. Is the whole outfit ready?
  3. What does the weather say they should wear?
  4. If outfit isn't ready, suggest dry alternatives.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models, schemas
from drying_logic import will_be_dry, estimate_dry_time
from weather import get_buffalo_forecast, suggest_layers

router = APIRouter(prefix="/api", tags=["recommendation"])


@router.get("/constants", response_model=schemas.AppConstants)
def get_constants():
    """Returns dropdown options and fabric dot colors for the front-end."""
    return schemas.APP_CONSTANTS


@router.get("/weather")
def get_weather():
    """Current weather snapshot for Buffalo."""
    return get_buffalo_forecast()


@router.post("/recommendation", response_model=schemas.RecommendationResponse)
def get_recommendation(
    body: schemas.RecommendationRequest,
    user_id: int,
    db: Session = Depends(get_db),
):
    # ── 1. Fetch the class ──────────────────────────────────────────────────
    cls = db.query(models.ClassSchedule).filter(
        models.ClassSchedule.id == body.class_id,
        models.ClassSchedule.user_id == user_id,
    ).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # ── 2. Fetch desired items ───────────────────────────────────────────────
    desired_items = db.query(models.ClothingItem).filter(
        models.ClothingItem.id.in_(body.desired_item_ids),
        models.ClothingItem.user_id == user_id,
    ).all()

    if len(desired_items) != len(body.desired_item_ids):
        raise HTTPException(status_code=404, detail="One or more clothing items not found")

    # ── 3. Check each item's readiness ────────────────────────────────────────
    item_results: list[schemas.ItemReadiness] = []
    all_ready = True

    for item in desired_items:
        if item.is_wet:
            readiness = will_be_dry(
                fabric=item.fabric,
                dryer_setting=item.dryer_setting,
                drying_started_at=item.drying_started_at,
                class_start_str=cls.start_time,
                travel_minutes=cls.travel_minutes,
            )
            item_ready = readiness.get("is_ready", False)
            if not item_ready:
                all_ready = False

            item_results.append(schemas.ItemReadiness(
                item_id=item.id,
                item_name=item.name,
                is_ready=item_ready,
                location=item.location,
                minutes_to_dry=readiness.get("minutes_to_dry"),
                minutes_remaining=readiness.get("minutes_remaining"),
                dry_at=readiness.get("dry_at"),
                leave_at=readiness.get("leave_at"),
            ))
        else:
            # Item is dry — always ready
            item_results.append(schemas.ItemReadiness(
                item_id=item.id,
                item_name=item.name,
                is_ready=True,
                location=item.location,
            ))

    # ── 4. Weather snapshot ──────────────────────────────────────────────────
    try:
        class_dt = datetime.fromisoformat(cls.start_time)
    except Exception:
        class_dt = datetime.now()

    weather = get_buffalo_forecast(class_dt)
    layering = suggest_layers(weather["temperature_f"], weather["precipitation_probability"])

    # ── 5. Find alternatives if outfit not ready ──────────────────────────────
    alternatives: list[models.ClothingItem] = []
    if not all_ready:
        desired_ids_set = set(body.desired_item_ids)
        needed_warmth = layering.get("warmth_score_needed", 5)

        all_user_items = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == user_id,
            models.ClothingItem.is_wet == False,
            models.ClothingItem.location == "closet",
        ).all()

        # Try to replace only the non-ready items
        not_ready_ids = {r.item_id for r in item_results if not r.is_ready}
        not_ready_categories = {
            item.category for item in desired_items if item.id in not_ready_ids
        }

        for item in all_user_items:
            if item.id in desired_ids_set:
                continue
            if item.category in not_ready_categories:
                alternatives.append(item)

        # Sort alternatives by how close their warmth score is to what weather needs
        alternatives.sort(key=lambda x: abs(x.warmth_score - needed_warmth))
        alternatives = alternatives[:4]

    # ── 6. Status message ─────────────────────────────────────────────────────
    if all_ready:
        leave_at_str = item_results[0].leave_at if item_results else None
        if not leave_at_str:
            # Compute leave_at from class time
            try:
                leave_dt = datetime.fromisoformat(cls.start_time)
                from datetime import timedelta
                leave_dt = leave_dt - timedelta(minutes=cls.travel_minutes)
                leave_at_str = leave_dt.isoformat()
            except Exception:
                leave_at_str = None

        msg = (
            f"Current time is {datetime.now().strftime('%I:%M %p')}. "
            f"Class is at {datetime.fromisoformat(cls.start_time).strftime('%I:%M %p')}. "
            f"{cls.travel_minutes}-min commute. Your outfit is ready to go!"
        )
        status_color = "green"
    else:
        not_ready = [r for r in item_results if not r.is_ready]
        names = ", ".join(r.item_name for r in not_ready)
        max_remaining = max((r.minutes_remaining or 0) for r in not_ready)
        msg = (
            f"{names} still need{'s' if len(not_ready)==1 else ''} ~{max_remaining} min to dry. "
            f"Your class is at {datetime.fromisoformat(cls.start_time).strftime('%I:%M %p')} — "
            f"this won't be ready in time!"
        )
        status_color = "red"
        leave_at_str = item_results[0].leave_at if item_results and item_results[0].leave_at else None

    return schemas.RecommendationResponse(
        outfit_ready=all_ready,
        status_color=status_color,
        status_message=msg,
        items=item_results,
        weather=weather,
        layering=layering,
        alternatives=[schemas.ClothingItemOut.model_validate(a) for a in alternatives],
        leave_at=leave_at_str,
    )

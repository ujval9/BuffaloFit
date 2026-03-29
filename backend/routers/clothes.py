"""
routers/clothes.py
------------------
CRUD endpoints for clothing items.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/clothes", tags=["clothes"])


@router.post("", response_model=schemas.ClothingItemOut, status_code=201)
def create_item(body: schemas.ClothingItemCreate, user_id: int, db: Session = Depends(get_db)):
    item = models.ClothingItem(user_id=user_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[schemas.ClothingItemOut])
def list_items(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.ClothingItem).filter(models.ClothingItem.user_id == user_id).all()


@router.get("/{item_id}", response_model=schemas.ClothingItemOut)
def get_item(item_id: int, user_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ClothingItem).filter(
        models.ClothingItem.id == item_id,
        models.ClothingItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=schemas.ClothingItemOut)
def update_item(item_id: int, user_id: int, body: schemas.ClothingItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.ClothingItem).filter(
        models.ClothingItem.id == item_id,
        models.ClothingItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = body.model_dump(exclude_unset=True)

    # If moving to dryer and drying_started_at not explicitly set → auto-set now
    if update_data.get("location") == "dryer" and "drying_started_at" not in update_data:
        update_data["drying_started_at"] = datetime.now()
        update_data["is_wet"] = True

    # If moving back to closet → mark clean and dry
    if update_data.get("location") == "closet":
        update_data.setdefault("is_wet", False)
        update_data.setdefault("is_clean", True)
        update_data["drying_started_at"] = None

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, user_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ClothingItem).filter(
        models.ClothingItem.id == item_id,
        models.ClothingItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()

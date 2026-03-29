"""
routers/classes.py
------------------
CRUD endpoints for the user's class schedule.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.post("", response_model=schemas.ClassScheduleOut, status_code=201)
def create_class(body: schemas.ClassScheduleCreate, user_id: int, db: Session = Depends(get_db)):
    cls = models.ClassSchedule(user_id=user_id, **body.model_dump())
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@router.get("", response_model=list[schemas.ClassScheduleOut])
def list_classes(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.ClassSchedule).filter(models.ClassSchedule.user_id == user_id).all()


@router.patch("/{class_id}", response_model=schemas.ClassScheduleOut)
def update_class(class_id: int, body: schemas.ClassScheduleCreate, user_id: int, db: Session = Depends(get_db)):
    cls = db.query(models.ClassSchedule).filter(
        models.ClassSchedule.id == class_id,
        models.ClassSchedule.user_id == user_id
    ).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    for key, value in body.model_dump().items():
        setattr(cls, key, value)
    
    db.commit()
    db.refresh(cls)
    return cls


@router.delete("/{class_id}", status_code=204)
def delete_class(class_id: int, user_id: int, db: Session = Depends(get_db)):
    cls = db.query(models.ClassSchedule).filter(
        models.ClassSchedule.id == class_id,
        models.ClassSchedule.user_id == user_id
    ).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()

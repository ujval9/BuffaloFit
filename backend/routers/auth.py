"""
routers/auth.py
---------------
Signup and Login endpoints.
We store a bcrypt-hashed password — never the plain text.
The front-end receives the user's id, email, and name to store in localStorage.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserOut)
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    """Create a new account."""
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        onboarding_done=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.UserOut)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials and return the user object."""
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@router.post("/username-login", response_model=schemas.UserOut)
def username_login(body: schemas.UsernameLoginRequest, db: Session = Depends(get_db)):
    """
    Demo-friendly auth: find or create a user by username alone.
    First visit  -> creates the account automatically.
    Return visit -> logs right back in.
    """
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    # Case-insensitive lookup by name
    user = (
        db.query(models.User)
        .filter(models.User.name.ilike(username))
        .first()
    )

    if not user:
        # First-time visitor — create their account
        user = models.User(
            email=None,
            name=username,
            password_hash=None,
            onboarding_done=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@router.patch("/onboarding/{user_id}", response_model=schemas.UserOut)
def complete_onboarding(user_id: int, db: Session = Depends(get_db)):
    """Mark onboarding as done after user sets up their first class schedule."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.onboarding_done = True
    db.commit()
    db.refresh(user)
    return user

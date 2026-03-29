"""
database.py
-----------
Sets up the connection to our SQLite database file (buffaloffit.db).
SQLite is a simple file-based database — no server needed, no installation.
SQLAlchemy is the "translator" that lets us write Python instead of raw SQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# The database lives in this file, right in the backend folder.
DATABASE_URL = "sqlite:///./buffaloffit.db"

# connect_args is required for SQLite to work with FastAPI's async threads
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal is the factory for creating database sessions (connections)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All our database models will inherit from this."""
    pass


def get_db():
    """
    Dependency — FastAPI calls this to open a DB session per request
    and automatically close it when done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

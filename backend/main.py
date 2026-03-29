"""
main.py
-------
The entry point for the FastAPI backend.
Run it with:  uvicorn main:app --reload
Then open:    http://localhost:8000/docs   ← interactive API explorer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 — ensures tables are registered before create_all

from routers import auth, clothes, classes, recommendation

# Create all database tables if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BuffaloFit API",
    description="Outfit + laundry planner for UB students",
    version="1.0.0",
)

# ── CORS: allow the React dev server to call our API ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(clothes.router)
app.include_router(classes.router)
app.include_router(recommendation.router)


@app.get("/")
def root():
    return {"message": "BuffaloFit API is running. Visit /docs for the interactive explorer."}

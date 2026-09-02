"""
main.py
-------
FastAPI application entry point.

Run:
    cd backend
    uvicorn main:app --reload --port 8000

Docs:
    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.models import Base
from db.session import engine

# ── Routers ────────────────────────────────────────────────────────────────────
from routers import auth, chat, customers, feedback, goals, plans, profile, risk, whatif

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("octovova.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all tables on startup (Alembic handles production migrations)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables ensured ✓")
    yield
    await engine.dispose()
    log.info("Engine disposed")


app = FastAPI(
    title="Octovova Finance Planning Engine",
    description=(
        "GenAI Personal Finance Planning Engine — deterministic math + "
        "Monte Carlo + LLM narration with strict numeric guardrails."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(customers.router)
app.include_router(profile.router)
app.include_router(risk.router)
app.include_router(goals.router)
app.include_router(plans.router)
app.include_router(whatif.router)
app.include_router(feedback.router)


# ── Root & Health checks ───────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {
        "name": "Octovova Finance Planning Engine API",
        "status": "online",
        "docs_url": "http://localhost:8000/docs",
        "health_url": "http://localhost:8000/health",
        "version": "1.0.0",
        "engine": "Deterministic Financial Math + Monte Carlo + OpenRouter LLM",
    }


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "engine_version": "1.0.0",
        "llm_model": settings.llm_hub_model,
        "hf_monte_carlo_url": settings.hf_monte_carlo_url,
    }


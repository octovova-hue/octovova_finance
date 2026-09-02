"""
core/config.py
--------------
Single source of truth for every environment variable.
Load once via `from core.config import settings`.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    supabase_db_url: str = "sqlite+aiosqlite:///./octovova_dev.db"

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret: str = "CHANGE_ME_use_a_long_random_secret_at_least_32_chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10_080  # 7 days

    # ── Hugging Face Monte Carlo (static JSON API) ────────────────────────────
    hf_monte_carlo_url: str = (
        "https://octovova-nifty50-monte-carlo-api.static.hf.space"
    )
    hf_api_token: str = ""  # empty = public space, fill for private

    # ── LLM Hub (OpenAI-compatible) ───────────────────────────────────────────
    llm_hub_url: str = "https://openrouter.ai/api/v1"
    llm_hub_api_key: str = ""
    llm_hub_model: str = "google/gemini-2.5-flash"
    llm_hub_referer: str = "https://octovova.finance"
    llm_hub_title: str = "Octovova Finance Planning Engine"

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── Financial engine defaults ─────────────────────────────────────────────
    default_inflation_rate: float = 0.06
    default_buffer_pct: float = 0.10
    default_emergency_months: int = 6

    # ── AI guardrail settings ─────────────────────────────────────────────────
    ai_max_retries: int = 1
    ai_max_tokens_narrative: int = 400
    ai_max_tokens_whatif: int = 200
    numeric_tolerance_pct: float = 0.5  # ± 0.5 % allowed in LLM output


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()

"""
financial_engine/monte_carlo_client.py
---------------------------------------
HTTP client for the Octovova Nifty50 Monte Carlo static JSON API.

The HF Space serves pre-computed bootstrap-resampled Monte Carlo results for
fixed horizons (1, 3, 5, 10, 15, 20 years). We do NOT POST parameters — we
GET the nearest available horizon and derive goal_success_probability from
the percentile data relative to the plan's expected CAGR.

Caches responses in-memory for 24 hours to avoid redundant network calls
against static data.
"""

import asyncio
import logging
import time
from typing import Optional

import httpx

from core.config import settings

log = logging.getLogger(__name__)

# Available horizons on the HF Space
_AVAILABLE_HORIZONS = [1, 3, 5, 10, 15, 20]

# In-memory cache: { horizon_int: (data_dict, fetched_at_epoch) }
_CACHE: dict[int, tuple[dict, float]] = {}
_CACHE_TTL = 86_400  # 24 hours


def _snap_horizon(years: float) -> int:
    """Snap horizon_years to the nearest available horizon integer."""
    return min(_AVAILABLE_HORIZONS, key=lambda h: abs(h - years))


def _cache_get(horizon: int) -> Optional[dict]:
    if horizon in _CACHE:
        data, ts = _CACHE[horizon]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _cache_set(horizon: int, data: dict) -> None:
    _CACHE[horizon] = (data, time.time())


def _derive_success_probability(mc_data: dict, plan_cagr_pct: float) -> float:
    """
    Derive a goal_success_probability (0–100) from the Monte Carlo percentile
    data for the given plan's expected CAGR.

    Logic:
      - If plan_cagr <= 0       → use prob_negative_cagr_pct as failure rate
      - If plan_cagr < 6        → use prob_below_6pct
      - If 6 <= plan_cagr < 10  → interpolate between p50 and p75
      - If 10 <= plan_cagr < 14 → use prob_10_to_14pct + prob_above_14pct
      - If plan_cagr >= 14      → use prob_above_14pct

    Returns a float in [0, 100] representing estimated success probability.
    """
    p_neg   = mc_data.get("prob_negative_cagr_pct", 15.0)
    p_b6    = mc_data.get("prob_below_6pct", 30.0)
    p_10_14 = mc_data.get("prob_10_to_14pct", 14.0)
    p_a14   = mc_data.get("prob_above_14pct", 40.0)

    if plan_cagr_pct <= 0:
        success = max(0.0, 100.0 - p_neg - p_b6)
    elif plan_cagr_pct < 6:
        failure = p_neg + p_b6
        success = max(0.0, 100.0 - failure)
    elif plan_cagr_pct < 10:
        # Between 6% and 10%: probability of achieving at least this CAGR
        # Approximate by linear interpolation between p50 and p75
        pct = mc_data.get("percentiles", {})
        p50 = pct.get("p50", 10.0)
        p75 = pct.get("p75", 20.0)
        # If plan_cagr sits between p50 and p75, ~50-75% of sims beat it
        t = max(0.0, min(1.0, (plan_cagr_pct - 6.0) / max(p75 - 6.0, 1.0)))
        success = 75.0 - t * 25.0  # 75% at 6%, ~50% at p75
    elif plan_cagr_pct < 14:
        success = p_10_14 + p_a14
    else:
        success = p_a14

    return round(min(100.0, max(0.0, success)), 2)


async def fetch_monte_carlo(
    horizon_years: float,
    plan_cagr_pct: float,
) -> dict:
    """
    Fetch Monte Carlo data for the snapped horizon and return enriched dict:
    {
        "horizon_used": int,
        "n_simulations": int,
        "mean_cagr_pct": float,
        "median_cagr_pct": float,
        "std_dev_pct": float,
        "percentiles": {...},
        "prob_negative_cagr_pct": float,
        "prob_below_6pct": float,
        "prob_10_to_14pct": float,
        "prob_above_14pct": float,
        "goal_success_probability": float,   ← derived
        "source": "hf_space" | "fallback"
    }
    Falls back to synthetic defaults on network errors.
    """
    horizon = _snap_horizon(horizon_years)
    cached = _cache_get(horizon)
    if cached:
        prob = _derive_success_probability(cached, plan_cagr_pct)
        return {**cached, "goal_success_probability": prob, "source": "hf_space_cached"}

    url = f"{settings.hf_monte_carlo_url}/api/simulation/horizon/{horizon}.json"
    headers: dict[str, str] = {}
    if settings.hf_api_token:
        headers["Authorization"] = f"Bearer {settings.hf_api_token}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data: dict = resp.json()
        _cache_set(horizon, data)
        prob = _derive_success_probability(data, plan_cagr_pct)
        return {**data, "horizon_used": horizon, "goal_success_probability": prob, "source": "hf_space"}
    except Exception as exc:
        log.warning("Monte Carlo fetch failed for horizon=%s: %s — using fallback", horizon, exc)
        return _fallback(horizon, plan_cagr_pct)


def _fallback(horizon: int, plan_cagr_pct: float) -> dict:
    """Synthetic fallback when HF Space is unreachable."""
    # Approximate Nifty50 historical stats
    fallback_data = {
        "horizon": f"{horizon}yr",
        "n_simulations": 0,
        "mean_cagr_pct": 12.0,
        "median_cagr_pct": 11.5,
        "std_dev_pct": 11.0,
        "percentiles": {"p5": -6.0, "p10": -2.0, "p25": 4.0, "p50": 11.5, "p75": 20.0, "p90": 28.0, "p95": 33.0},
        "prob_negative_cagr_pct": 14.0,
        "prob_below_6pct": 30.0,
        "prob_10_to_14pct": 14.0,
        "prob_above_14pct": 42.0,
    }
    prob = _derive_success_probability(fallback_data, plan_cagr_pct)
    return {**fallback_data, "horizon_used": horizon, "goal_success_probability": prob, "source": "fallback"}

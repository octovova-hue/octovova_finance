"""
ai_service/orchestrator.py
--------------------------
LLM Hub orchestrator — calls OpenRouter (OpenAI-compatible API).

Responsibilities:
  - Build prompts from templates
  - Wrap user free-text in <user_input> tags (injection defence)
  - Call LLM Hub with retry on failure
  - Pass response through validators.py
  - Return validated JSON or template fallback

The LLM NEVER computes financial numbers. Every number in the prompt
comes from the deterministic engine and is cross-checked after generation.
"""

import json
import logging
from typing import Optional

import httpx

from core.config import settings
from ai_service import validators as val
from ai_service.prompt_templates import plan_narrative as pn
from ai_service.prompt_templates import whatif_intent as wi

log = logging.getLogger(__name__)

_LLM_HEADERS = {
    "Content-Type": "application/json",
    "HTTP-Referer": settings.llm_hub_referer,
    "X-Title": settings.llm_hub_title,
}


async def _call_llm(messages: list[dict], max_tokens: int) -> Optional[str]:
    """Raw call to LLM Hub. Returns content string or None on error."""
    url = f"{settings.llm_hub_url.rstrip('/')}/chat/completions"
    headers = {**_LLM_HEADERS, "Authorization": f"Bearer {settings.llm_hub_api_key}"}
    body = {
        "model": settings.llm_hub_model,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "").strip()
    except Exception as exc:
        log.error("LLM Hub call failed: %s", exc)
    return None


# ── Plan Narrative Generation ──────────────────────────────────────────────────

async def generate_plan_narrative(
    customer_first_name: str,
    risk_category: str,
    goal_name: str,
    target_year: int,
    target_fv: float,
    plan_type: str,
    equity_pct: float,
    debt_pct: float,
    cash_pct: float,
    expected_cagr: float,
    sip_required: float,
    goal_success_probability: float,
    horizon_years: float,
) -> tuple[dict, str]:
    """
    Generate and validate a plan narrative.
    Returns (narrative_dict, validation_status).
    narrative_dict keys: name, explanation, risk_note
    """
    # Numbers the LLM is allowed to use (cross-check whitelist)
    allowed_numbers = [
        round(equity_pct * 100, 1),
        round(debt_pct * 100, 1),
        round(cash_pct * 100, 1),
        expected_cagr,
        round(sip_required),
        round(target_fv),
        float(target_year),
        round(horizon_years, 1),
        round(goal_success_probability, 1),
    ]

    user_msg = pn.build_user_message(
        customer_first_name=customer_first_name,
        risk_category=risk_category,
        goal_name=goal_name,
        target_year=target_year,
        target_fv=target_fv,
        plan_type=plan_type,
        equity_pct=equity_pct,
        debt_pct=debt_pct,
        cash_pct=cash_pct,
        expected_cagr=expected_cagr,
        sip_required=sip_required,
        goal_success_probability=goal_success_probability,
        horizon_years=horizon_years,
    )
    messages = [
        {"role": "system", "content": pn.SYSTEM_PROMPT},
        {"role": "user",   "content": user_msg},
    ]

    for attempt in range(settings.ai_max_retries + 1):
        raw = await _call_llm(messages, max_tokens=settings.ai_max_tokens_narrative)
        if raw is None:
            log.warning("LLM returned None on attempt %d", attempt + 1)
            continue
        result = val.validate_narrative(raw, allowed_numbers, settings.numeric_tolerance_pct)
        if result.status == "passed":
            return result.parsed, "passed"
        log.warning("Narrative validation failed attempt %d: %s", attempt + 1, result.errors)

    # All retries exhausted → deterministic template fallback
    log.warning("Using template fallback for plan_type=%s", plan_type)
    fallback = val.narrative_template_fallback(
        plan_type=plan_type,
        equity_pct=equity_pct,
        debt_pct=debt_pct,
        cash_pct=cash_pct,
        expected_cagr=expected_cagr,
        sip_required=sip_required,
        goal_name=goal_name,
        goal_fv=target_fv,
        target_year=target_year,
    )
    return fallback, "template_fallback"


# ── What-If Intent Parsing ─────────────────────────────────────────────────────

async def parse_whatif_intent(user_question: str) -> tuple[Optional[dict], str]:
    """
    Parse user's free-text what-if question into a structured intent dict.
    Returns (intent_dict | None, status).
    User text is always wrapped in <user_input> tags.
    """
    messages = [
        {"role": "system", "content": wi.WHATIF_SYSTEM_PROMPT},
        {"role": "user",   "content": wi.build_whatif_user_message(user_question)},
    ]

    for attempt in range(settings.ai_max_retries + 1):
        raw = await _call_llm(messages, max_tokens=settings.ai_max_tokens_whatif)
        if raw is None:
            continue
        result = val.validate_whatif_intent(raw)
        if result.status == "passed":
            return result.parsed, "passed"
        log.warning("What-if intent validation failed attempt %d: %s", attempt + 1, result.errors)

    return None, "failed"


# ── What-If Explanation Narration ─────────────────────────────────────────────

async def generate_whatif_explanation(
    parameter_label: str,
    old_value: float,
    new_value: float,
    old_corpus: float,
    new_corpus: float,
    goal_fv: float,
    goal_name: str,
    target_year: int,
    plan_cagr: float,
) -> str:
    """
    Generate a plain-English explanation for a what-if recomputation result.
    Falls back to a template if LLM fails.
    """
    system_p, user_msg = wi.build_whatif_explanation_prompt(
        parameter_label=parameter_label,
        old_value=old_value,
        new_value=new_value,
        old_corpus=old_corpus,
        new_corpus=new_corpus,
        goal_fv=goal_fv,
        goal_name=goal_name,
        target_year=target_year,
        plan_cagr=plan_cagr,
    )
    messages = [
        {"role": "system", "content": system_p},
        {"role": "user",   "content": user_msg},
    ]

    for attempt in range(settings.ai_max_retries + 1):
        raw = await _call_llm(messages, max_tokens=settings.ai_max_tokens_narrative)
        if raw:
            # Soft validation — just check for banned phrases
            if not val._has_banned_phrases(raw):
                return raw
            log.warning("What-if explanation has banned phrases, retrying")

    delta = new_corpus - goal_fv
    direction = "surplus" if delta >= 0 else "shortfall"
    return (
        f"Changing {parameter_label} from {old_value:,.0f} to {new_value:,.0f} "
        f"shifts your projected corpus to ₹{new_corpus:,.0f}. "
        f"This results in a {direction} of ₹{abs(delta):,.0f} against your "
        f"{goal_name} target of ₹{goal_fv:,.0f} by {target_year}. "
        f"All projections are illustrative estimates."
    )

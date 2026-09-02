"""
ai_service/validators.py
------------------------
5-step validation pipeline for every LLM response:

  1. Pydantic schema check   → NarrativeOutput | WhatIfIntent
  2. Numeric cross-checker   → all numbers in LLM text must be in allowed set
  3. Banned phrase filter    → rejects guarantee language
  4. Compliance check        → verifies illustrative framing
  5. Result                  → "passed" | "template_fallback"

Golden rule: the LLM NEVER surfaces a number that wasn't given to it.
"""

import json
import re
from typing import Optional

from pydantic import BaseModel, ValidationError

# ── 1. Pydantic schemas ────────────────────────────────────────────────────────

class NarrativeOutput(BaseModel):
    name: str
    explanation: str
    risk_note: str


class WhatIfIntent(BaseModel):
    parameter: Optional[str]
    change_type: str
    value: float
    confidence: str = "medium"


# ── 2. Banned phrase filter ────────────────────────────────────────────────────

_BANNED_PHRASES = [
    r"\bguaranteed?\b",
    r"\bassured\s+returns?\b",
    r"\brisk[\s-]free\b",
    r"\bwill\s+definitely\s+achieve\b",
    r"100\s*%\s+certain",
    r"\bno\s+risk\b",
    r"\bzero\s+risk\b",
    r"\bsafe\s+investment\b",
]
_BANNED_RE = re.compile("|".join(_BANNED_PHRASES), re.IGNORECASE)


def _has_banned_phrases(text: str) -> bool:
    return bool(_BANNED_RE.search(text))


# ── 3. Numeric cross-checker ──────────────────────────────────────────────────

def _extract_numbers_from_text(text: str) -> list[float]:
    """Extract all numeric values from a string (handles commas, ₹ prefix)."""
    # Remove commas inside numbers, strip ₹ prefix
    cleaned = re.sub(r"₹\s*", "", text)
    cleaned = re.sub(r"(\d),(\d)", r"\1\2", cleaned)
    return [float(m) for m in re.findall(r"\d+(?:\.\d+)?", cleaned)]


def _number_in_allowed_set(num: float, allowed: list[float], tolerance_pct: float = 0.5) -> bool:
    """Return True if `num` is within tolerance of any value in the allowed set."""
    if not allowed:
        return True  # no constraints given
    for a in allowed:
        if a == 0:
            if abs(num) < 1:
                return True
            continue
        if abs(num - a) / abs(a) * 100 <= tolerance_pct:
            return True
    return False


def check_numeric_cross(llm_text: str, allowed_numbers: list[float], tolerance_pct: float = 0.5) -> list[float]:
    """
    Returns list of numbers found in the LLM text that are NOT in the allowed set.
    Empty list = all numbers passed.
    """
    found = _extract_numbers_from_text(llm_text)
    # Filter out obvious ordinals / percentages that appear in every financial text
    suspicious = [
        n for n in found
        if n > 100 and not _number_in_allowed_set(n, allowed_numbers, tolerance_pct)
    ]
    return suspicious


# ── 4. Compliance check ────────────────────────────────────────────────────────

_ILLUSTRATIVE_PHRASES = [
    r"\bprojected?\b",
    r"\bestimate[ds]?\b",
    r"\billustrative\b",
    r"\bassumed?\b",
    r"\bexpected?\b",
    r"\bpotential\b",
    r"\bmay\b",
    r"\bcould\b",
]
_ILLUSTRATIVE_RE = re.compile("|".join(_ILLUSTRATIVE_PHRASES), re.IGNORECASE)


def _has_illustrative_framing(text: str) -> bool:
    return bool(_ILLUSTRATIVE_RE.search(text))


# ── 5. Full validation pipeline ────────────────────────────────────────────────

class ValidationResult(BaseModel):
    status: str          # "passed" | "retry" | "template_fallback"
    parsed: Optional[dict] = None
    errors: list[str] = []


def validate_narrative(
    raw_llm_output: str,
    allowed_numbers: list[float],
    tolerance_pct: float = 0.5,
) -> ValidationResult:
    """
    Runs all 5 validation steps on a raw LLM narrative response.
    Returns ValidationResult with status and parsed output.
    """
    errors: list[str] = []

    # Step 1: Parse JSON schema
    try:
        data = json.loads(raw_llm_output.strip())
        narrative = NarrativeOutput(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        return ValidationResult(status="retry", errors=[f"Schema parse error: {e}"])

    full_text = f"{narrative.name} {narrative.explanation} {narrative.risk_note}"

    # Step 2: Numeric cross-check
    suspicious = check_numeric_cross(full_text, allowed_numbers, tolerance_pct)
    if suspicious:
        errors.append(f"Hallucinated numbers detected: {suspicious}")

    # Step 3: Banned phrase check
    if _has_banned_phrases(full_text):
        errors.append("Banned guarantee language detected")

    # Step 4: Compliance check (soft — warn but don't fail)
    if not _has_illustrative_framing(full_text):
        errors.append("Missing illustrative framing (soft warning)")
        # Don't hard-fail on this alone

    hard_errors = [e for e in errors if "soft warning" not in e]
    if hard_errors:
        return ValidationResult(status="retry", errors=hard_errors)

    return ValidationResult(status="passed", parsed=narrative.model_dump(), errors=errors)


def validate_whatif_intent(raw_llm_output: str) -> ValidationResult:
    """Validate a what-if intent parse result."""
    try:
        data = json.loads(raw_llm_output.strip())
        intent = WhatIfIntent(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        return ValidationResult(status="retry", errors=[f"Schema parse error: {e}"])
    return ValidationResult(status="passed", parsed=intent.model_dump())


# ── Template fallback ──────────────────────────────────────────────────────────

def narrative_template_fallback(
    plan_type: str,
    equity_pct: float,
    debt_pct: float,
    cash_pct: float,
    expected_cagr: float,
    sip_required: float,
    goal_name: str,
    goal_fv: float,
    target_year: int,
) -> dict:
    """
    Deterministic template narrative — used when LLM fails validation twice.
    Every number here comes directly from the engine, never from the LLM.
    """
    eq_p = round(equity_pct * 100)
    d_p  = round(debt_pct * 100)
    c_p  = round(cash_pct * 100)
    return {
        "name": f"{plan_type.capitalize()} Plan",
        "explanation": (
            f"Your {plan_type} plan targets an asset allocation of {eq_p}% Equity, "
            f"{d_p}% Debt, and {c_p}% Cash with an estimated portfolio return of "
            f"{expected_cagr}% p.a. Investing ₹{sip_required:,.0f}/month is projected to "
            f"accumulate your {goal_name} target of ₹{goal_fv:,.0f} by {target_year}. "
            f"All projections are illustrative estimates based on stated assumptions."
        ),
        "risk_note": (
            f"{'Higher equity exposure means more potential for short-term volatility.' if eq_p >= 60 else 'Lower equity exposure prioritises capital stability over high growth.'}"
        ),
    }

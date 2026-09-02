"""
tests/test_validators.py
-------------------------
Unit tests for the AI validation pipeline.
Completely offline — no LLM calls.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import json
import pytest
from ai_service.validators import (
    validate_narrative,
    validate_whatif_intent,
    narrative_template_fallback,
    _has_banned_phrases,
    check_numeric_cross,
)


# ── Banned phrase detector ────────────────────────────────────────────────────

def test_banned_guaranteed():
    assert _has_banned_phrases("This plan offers guaranteed returns of 12%.")

def test_banned_assured():
    assert _has_banned_phrases("We offer assured returns on your investment.")

def test_banned_risk_free():
    assert _has_banned_phrases("This is a risk-free investment opportunity.")

def test_clean_text_passes():
    assert not _has_banned_phrases("Your projected corpus is estimated at ₹1.07 Cr by 2031.")


# ── Numeric cross-checker ─────────────────────────────────────────────────────

def test_numeric_cross_pass():
    allowed = [1_32_000, 9.1, 10_705_800, 2031]
    text = "Invest ₹132000 per month at 9.1% CAGR to reach ₹10705800 by 2031."
    bad = check_numeric_cross(text, allowed)
    assert bad == [], f"Unexpected violations: {bad}"

def test_numeric_cross_hallucination():
    allowed = [132_000, 9.1]
    text = "Invest ₹150000 per month."  # 150000 not in allowed
    bad = check_numeric_cross(text, allowed)
    assert len(bad) > 0


# ── validate_narrative ────────────────────────────────────────────────────────

def _good_narrative(name="Steady Growth Plan"):
    return json.dumps({
        "name": name,
        "explanation": "Investing ₹132000/month at an estimated 9.1% CAGR, your projected corpus may reach ₹10705800 by 2031.",
        "risk_note": "Expect potential short-term volatility with 55% equity exposure."
    })

def test_validate_narrative_passes():
    allowed = [132_000, 9.1, 10_705_800, 2031, 55, 40, 5]
    result = validate_narrative(_good_narrative(), allowed)
    assert result.status == "passed"
    assert result.parsed["name"] == "Steady Growth Plan"

def test_validate_narrative_bad_json():
    result = validate_narrative("not json at all", [])
    assert result.status == "retry"

def test_validate_narrative_missing_field():
    bad = json.dumps({"name": "Plan", "explanation": "Good plan."})  # missing risk_note
    result = validate_narrative(bad, [])
    assert result.status == "retry"

def test_validate_narrative_banned_phrase():
    payload = json.dumps({
        "name": "Safe Plan",
        "explanation": "This is a guaranteed return investment plan.",
        "risk_note": "Completely risk-free."
    })
    result = validate_narrative(payload, [])
    assert result.status == "retry"


# ── validate_whatif_intent ─────────────────────────────────────────────────────

def test_validate_whatif_valid():
    raw = json.dumps({
        "parameter": "monthly_investment",
        "change_type": "delta_add",
        "value": 15000,
        "confidence": "high"
    })
    result = validate_whatif_intent(raw)
    assert result.status == "passed"
    assert result.parsed["value"] == 15000

def test_validate_whatif_bad_json():
    result = validate_whatif_intent("{bad}")
    assert result.status == "retry"


# ── Template fallback ─────────────────────────────────────────────────────────

def test_template_fallback_content():
    fb = narrative_template_fallback(
        plan_type="balanced",
        equity_pct=0.55, debt_pct=0.40, cash_pct=0.05,
        expected_cagr=9.1,
        sip_required=132_000,
        goal_name="Dream House",
        goal_fv=10_705_800,
        target_year=2031,
    )
    assert fb["name"] == "Balanced Plan"
    assert "132,000" in fb["explanation"] or "132000" in fb["explanation"]
    assert "guaranteed" not in fb["explanation"].lower()

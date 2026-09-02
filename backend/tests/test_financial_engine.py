"""
tests/test_financial_engine.py
-------------------------------
Unit tests for the deterministic engine.
These tests are completely offline — no DB, no LLM, no Monte Carlo.
Run: cd backend && python -m pytest tests/test_financial_engine.py -v
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import financial_engine.financial_engine as fe
from financial_engine.allocation_rules import (
    build_three_plans,
    check_conflicts,
    apply_short_horizon_cap,
)


# ── net_worth ──────────────────────────────────────────────────────────────────

def test_net_worth_basic():
    assert fe.net_worth(1_200_000, 500_000) == 700_000.0


def test_net_worth_negative():
    assert fe.net_worth(300_000, 500_000) == -200_000.0


# ── cash flow & savings capacity ──────────────────────────────────────────────

def test_monthly_cash_flow():
    assert fe.monthly_cash_flow(150_000, 80_000) == 70_000.0


def test_savings_capacity_10pct_buffer():
    # 70 000 * 0.90 = 63 000
    assert fe.savings_capacity(150_000, 80_000, 0.10) == 63_000.0


def test_emergency_fund():
    assert fe.emergency_fund_requirement(80_000, 6) == 480_000.0


# ── goal FV ───────────────────────────────────────────────────────────────────

def test_goal_fv_5yr():
    # 80 00 000 * (1.06)^5 ≈ 10 705 800
    fv = fe.goal_future_value(8_000_000, 5, 0.06)
    assert abs(fv - 10_705_803.67) < 10, f"Got {fv}"


# ── SIP ───────────────────────────────────────────────────────────────────────

def test_sip_zero_rate():
    sip = fe.required_sip(12_000, 0.0, 1)
    assert sip == 12_000 / 12


def test_sip_roundtrip():
    """required_sip -> sip_future_value should recover the target FV."""
    target = 10_000_000
    rate   = 0.091
    years  = 5
    sip    = fe.required_sip(target, rate, years)
    fv     = fe.sip_future_value(sip, rate, years)
    assert abs(fv - target) < 1.0, f"Roundtrip error: {abs(fv - target)}"


# ── Risk scoring ──────────────────────────────────────────────────────────────

def test_risk_score_balanced():
    assert fe.risk_score([4, 3, 4, 4, 2]) == 17


def test_risk_category_balanced():
    assert fe.risk_category(17) == "Balanced"


def test_risk_category_aggressive():
    assert fe.risk_category(25) == "Aggressive"


def test_risk_wrong_count():
    with pytest.raises(ValueError):
        fe.risk_score([1, 2, 3])


# ── Allocation rules ──────────────────────────────────────────────────────────

def test_short_horizon_cap():
    alloc = {"equity": 0.75, "debt": 0.21, "cash": 0.04}
    capped = apply_short_horizon_cap(alloc, 2.0)
    assert capped["equity"] == 0.25
    assert abs(capped["debt"] - 0.71) < 0.001


def test_no_short_horizon_cap_long():
    alloc = {"equity": 0.75, "debt": 0.21, "cash": 0.04}
    result = apply_short_horizon_cap(alloc, 5.0)
    assert result["equity"] == 0.75


# ── Three plans ───────────────────────────────────────────────────────────────

def test_build_three_plans_count():
    plans = build_three_plans(8_000_000, 5, 0.06)
    assert len(plans) == 3


def test_build_three_plans_cagr_ordered():
    plans = build_three_plans(8_000_000, 5, 0.06)
    cagrs = [p.expected_cagr for p in plans]
    assert cagrs[0] < cagrs[1] < cagrs[2], "CAGRs should be ascending (Con < Bal < Growth)"


def test_already_funded_zero_sip():
    # If existing assets cover the FV, SIP should be 0
    today_cost = 1_000_000
    horizon    = 5
    infl       = 0.06
    fv = fe.goal_future_value(today_cost, horizon, infl)
    plans = build_three_plans(today_cost, horizon, infl, existing_dedicated_assets=fv + 1)
    for p in plans:
        assert p.monthly_investment_needed == 0.0


# ── Conflict flags ────────────────────────────────────────────────────────────

def test_negative_cash_flow_flag():
    flags = check_conflicts(
        monthly_income=50_000, monthly_expenses=70_000,
        total_liquid_assets=200_000, existing_dedicated_assets=0,
        goal_fv=5_000_000, required_sip=20_000,
        savings_capacity=-18_000, horizon_years=10,
    )
    assert flags.negative_cash_flow is True


def test_emergency_fund_gap_flag():
    flags = check_conflicts(
        monthly_income=150_000, monthly_expenses=80_000,
        total_liquid_assets=100_000,  # needs 480 000
        existing_dedicated_assets=0,
        goal_fv=10_000_000, required_sip=50_000,
        savings_capacity=63_000, horizon_years=5,
    )
    assert flags.emergency_fund_gap is True


def test_short_horizon_flag():
    flags = check_conflicts(
        monthly_income=150_000, monthly_expenses=80_000,
        total_liquid_assets=500_000, existing_dedicated_assets=0,
        goal_fv=1_000_000, required_sip=50_000,
        savings_capacity=63_000, horizon_years=2,
    )
    assert flags.short_horizon is True

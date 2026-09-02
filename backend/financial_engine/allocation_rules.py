"""
financial_engine/allocation_rules.py
--------------------------------------
Rule / Decision Engine — extends the base deterministic engine with:
  1. Blueprint-exact allocation table (CAGR values match blueprint, not engine defaults)
  2. 3-plan comparison (Conservative / Balanced / Growth) used for the compare screen
  3. Business conflict rules (short horizon, negative cash flow, emergency fund gap,
     already-funded goal, SIP > savings capacity)

Golden rule: NO I/O, NO randomness, NO LLM calls here.
"""

from dataclasses import dataclass, field
from typing import Optional

import financial_engine.financial_engine as fe

# ── Blueprint allocation table (matches Section 9 of the architecture doc) ─────
# These CAGR values differ slightly from the engine's blended formula because
# the blueprint uses rounded / product-specific values.  They are used in the
# final response; the engine's blended_expected_return() is used for math.

BLUEPRINT_ALLOCATION: dict[str, dict] = {
    "Conservative": {"equity": 0.25, "debt": 0.65, "cash": 0.10, "cagr": 7.2},
    "Moderate":     {"equity": 0.40, "debt": 0.52, "cash": 0.08, "cagr": 8.1},
    "Balanced":     {"equity": 0.55, "debt": 0.40, "cash": 0.05, "cagr": 9.1},
    "Growth":       {"equity": 0.75, "debt": 0.21, "cash": 0.04, "cagr": 10.2},
    "Aggressive":   {"equity": 0.85, "debt": 0.12, "cash": 0.03, "cagr": 10.9},
}

# The three plans surfaced to the user (regardless of personal risk profile)
THREE_PLAN_DEFS = [
    ("Conservative Plan", "conservative", "Conservative"),
    ("Balanced Plan",     "balanced",     "Balanced"),
    ("Growth Plan",       "growth",       "Aggressive"),
]


@dataclass
class ConflictFlags:
    short_horizon: bool = False
    negative_cash_flow: bool = False
    emergency_fund_gap: bool = False
    already_funded: bool = False
    sip_exceeds_capacity: bool = False
    messages: list[str] = field(default_factory=list)

    @property
    def has_conflict(self) -> bool:
        return any([
            self.short_horizon,
            self.negative_cash_flow,
            self.emergency_fund_gap,
            self.already_funded,
            self.sip_exceeds_capacity,
        ])

    def to_dict(self) -> dict:
        return {
            "short_horizon": self.short_horizon,
            "negative_cash_flow": self.negative_cash_flow,
            "emergency_fund_gap": self.emergency_fund_gap,
            "already_funded": self.already_funded,
            "sip_exceeds_capacity": self.sip_exceeds_capacity,
            "messages": self.messages,
        }


def check_conflicts(
    monthly_income: float,
    monthly_expenses: float,
    total_liquid_assets: float,
    existing_dedicated_assets: float,
    goal_fv: float,
    required_sip: float,
    savings_capacity: float,
    horizon_years: float,
) -> ConflictFlags:
    """
    Evaluate all 5 business conflict rules against the customer's numbers.
    Returns a ConflictFlags dataclass (no I/O).
    """
    flags = ConflictFlags()

    if horizon_years < 3:
        flags.short_horizon = True
        flags.messages.append(
            "Goal timeline is under 3 years: equity exposure capped to 25% "
            "to safeguard capital against short-term volatility."
        )

    if monthly_expenses > monthly_income:
        flags.negative_cash_flow = True
        flags.messages.append(
            "Monthly expenses exceed income. "
            "Review and reduce expenses before generating investment plans."
        )

    emergency_needed = fe.emergency_fund_requirement(monthly_expenses)
    if total_liquid_assets < emergency_needed:
        flags.emergency_fund_gap = True
        gap = round(emergency_needed - total_liquid_assets, 2)
        flags.messages.append(
            f"Build a 6-month emergency reserve of ₹{emergency_needed:,.0f} "
            f"before deploying surplus into long-term assets. "
            f"Current shortfall: ₹{gap:,.0f}."
        )

    if existing_dedicated_assets >= goal_fv:
        flags.already_funded = True
        flags.messages.append(
            "Existing dedicated assets already cover the inflation-adjusted goal. "
            "Required monthly SIP is ₹0."
        )

    if required_sip > savings_capacity and not flags.already_funded:
        flags.sip_exceeds_capacity = True
        shortfall = round(required_sip - savings_capacity, 2)
        flags.messages.append(
            f"Required SIP (₹{required_sip:,.0f}) exceeds current savings capacity "
            f"(₹{savings_capacity:,.0f}) by ₹{shortfall:,.0f}. "
            "Consider extending the goal timeline, reducing the target cost, "
            "or increasing monthly income."
        )

    return flags


def apply_short_horizon_cap(allocation: dict, horizon_years: float) -> dict:
    """If horizon < 3 years, cap equity at 25% and redistribute to debt."""
    if horizon_years >= 3 or allocation.get("equity", 0) <= 0.25:
        return allocation
    excess = allocation["equity"] - 0.25
    return {
        "equity": 0.25,
        "debt": round(allocation.get("debt", 0) + excess, 4),
        "cash": allocation.get("cash", 0),
    }


def get_allocation_for_plan(plan_type: str, horizon_years: float) -> dict:
    """
    Return allocation dict for a plan type, applying short-horizon cap if needed.
    plan_type: 'conservative' | 'balanced' | 'growth'
    """
    mapping = {
        "conservative": "Conservative",
        "balanced": "Balanced",
        "growth": "Aggressive",
    }
    category = mapping.get(plan_type.lower(), "Balanced")
    blueprint = BLUEPRINT_ALLOCATION[category]
    allocation = {"equity": blueprint["equity"], "debt": blueprint["debt"], "cash": blueprint["cash"]}
    return apply_short_horizon_cap(allocation, horizon_years)


def build_three_plans(
    today_cost: float,
    horizon_years: float,
    inflation_rate: float = 0.06,
    existing_dedicated_assets: float = 0.0,
) -> list[fe.PlanResult]:
    """
    Build 3 plan objects (Conservative / Balanced / Growth) using the engine.
    Short-horizon cap applied to allocations where needed.
    If goal is already funded, SIP is forced to 0.
    """
    results = []
    goal_fv = fe.goal_future_value(today_cost, horizon_years, inflation_rate)
    already_funded = existing_dedicated_assets >= goal_fv

    for plan_name, plan_type, category in THREE_PLAN_DEFS:
        blueprint = BLUEPRINT_ALLOCATION[category]
        base_alloc = {"equity": blueprint["equity"], "debt": blueprint["debt"], "cash": blueprint["cash"]}
        alloc = apply_short_horizon_cap(base_alloc, horizon_years)
        cagr = fe.blended_expected_return(alloc)

        fv = goal_fv
        sip = 0.0 if already_funded else fe.required_sip(fv, cagr, horizon_years)
        projected = fe.sip_future_value(sip, cagr, horizon_years) + existing_dedicated_assets
        funded_pct = round(min(projected / fv, 1.5) * 100, 1) if fv else 0.0

        results.append(
            fe.PlanResult(
                plan_name=plan_name,
                risk_level=plan_type,
                allocation=alloc,
                expected_cagr=round(blueprint["cagr"], 2),  # use blueprint CAGR for display
                monthly_investment_needed=sip,
                projected_corpus=round(projected, 2),
                goal_fv=fv,
                funded_pct=funded_pct,
            )
        )
    return results

"""
financial_engine.py
--------------------
Deterministic financial-calculation module.

Golden rule: the LLM never does arithmetic that matters. Every function
here is a PURE function (no I/O, no randomness, no hidden state) — same
input always produces the same output. This is the module you point to
in the demo and say "this is deterministic, not AI."

Formulas implemented (from the notebook page + architecture docs):
  1) Remaining Amt (savings capacity) = cash_flow * (1 - buffer%)
     cash_flow = monthly_income - monthly_expenses
  2) Emergency Fund = 6 * monthly_expenses
  3) Goal FV = present_goal * (1 + inflation_rate) ** years
  4) Compound Growth Projection = P * (1 + r) ** n
  5) SIP required to hit a goal (standard SIP-FV formula)
  6) Retirement corpus (4% withdrawal rule)
  7) Risk scoring -> category -> allocation lookup
  8) Net worth = sum(assets) - sum(liabilities)
"""

from dataclasses import dataclass, field
from typing import List, Literal, Optional
import math

ENGINE_VERSION = "1.0.0"

RiskCategory = Literal["Conservative", "Moderate", "Balanced", "Growth", "Aggressive"]


# ---------------------------------------------------------------------------
# 1. Net worth
# ---------------------------------------------------------------------------

def net_worth(total_assets: float, total_liabilities: float) -> float:
    """Net worth = Σ(assets) − Σ(liabilities)"""
    return round(total_assets - total_liabilities, 2)


# ---------------------------------------------------------------------------
# 2. Cash flow & savings capacity  ->  matches notebook formula (1)
# ---------------------------------------------------------------------------

def monthly_cash_flow(monthly_income: float, monthly_expenses: float) -> float:
    """Cash Flow = Monthly Income - Monthly Expenses"""
    return round(monthly_income - monthly_expenses, 2)


def savings_capacity(monthly_income: float, monthly_expenses: float,
                      buffer_pct: float = 0.10) -> float:
    """
    Remaining Amt = (Cash Flow) x (1 - buffer%)
    buffer_pct is a fraction, e.g. 0.10 for 10%.
    """
    cash_flow = monthly_cash_flow(monthly_income, monthly_expenses)
    remaining = cash_flow * (1 - buffer_pct)
    return round(remaining, 2)


# ---------------------------------------------------------------------------
# 3. Emergency fund  ->  matches notebook formula (2)
# ---------------------------------------------------------------------------

def emergency_fund_requirement(monthly_expenses: float, months: int = 6) -> float:
    """Emergency Fund = 6 x Monthly Expenses (configurable multiplier)"""
    return round(monthly_expenses * months, 2)


# ---------------------------------------------------------------------------
# 4. Goal future value (inflation-adjusted)  ->  matches notebook formula (3)
# ---------------------------------------------------------------------------

def goal_future_value(present_cost: float, years: float,
                       inflation_rate: float = 0.06) -> float:
    """
    Goal = Present Goal x (1 + inflation_rate) ^ years
    inflation_rate is a fraction, e.g. 0.06 for 6%.
    """
    fv = present_cost * ((1 + inflation_rate) ** years)
    return round(fv, 2)


# ---------------------------------------------------------------------------
# 5. Compound growth projection  ->  matches notebook formula (4)
# ---------------------------------------------------------------------------

def compound_growth(principal: float, annual_rate: float, years: float) -> float:
    """Compound Growth = P x (1 + r) ^ n"""
    return round(principal * ((1 + annual_rate) ** years), 2)


def sip_future_value(monthly_sip: float, annual_rate: float, years: float) -> float:
    """
    Future value of a monthly SIP (ordinary annuity, monthly compounding).
    FV = SIP x (((1+r)^n - 1) / r) x (1+r)
    r = monthly rate, n = number of months
    """
    r = annual_rate / 12
    n = int(years * 12)
    if r == 0:
        return round(monthly_sip * n, 2)
    fv = monthly_sip * (((1 + r) ** n - 1) / r) * (1 + r)
    return round(fv, 2)


def required_sip(target_fv: float, annual_rate: float, years: float) -> float:
    """
    SIP required to hit a goal:
    SIP = FV x r / (((1+r)^n - 1) x (1+r))
    r = monthly expected return, n = months
    """
    r = annual_rate / 12
    n = int(years * 12)
    if n <= 0:
        return target_fv
    if r == 0:
        return round(target_fv / n, 2)
    sip = target_fv * r / (((1 + r) ** n - 1) * (1 + r))
    return round(sip, 2)


# ---------------------------------------------------------------------------
# 6. Retirement corpus (4% withdrawal rule)
# ---------------------------------------------------------------------------

def retirement_corpus(annual_expense_today: float, years_to_retirement: float,
                       inflation_rate: float = 0.06,
                       withdrawal_rate: float = 0.04) -> float:
    """
    Inflate today's annual expense to the retirement year, then apply the
    4% withdrawal rule: corpus = annual_expense_at_retirement / withdrawal_rate
    (equivalent to x25 at the standard 4% rule).
    """
    annual_expense_at_retirement = goal_future_value(
        annual_expense_today, years_to_retirement, inflation_rate
    )
    corpus = annual_expense_at_retirement / withdrawal_rate
    return round(corpus, 2)


# ---------------------------------------------------------------------------
# 7. Risk assessment -> category -> allocation
# ---------------------------------------------------------------------------

RISK_SCORE_BANDS = [
    (5, 9, "Conservative"),
    (10, 14, "Moderate"),
    (15, 19, "Balanced"),
    (20, 23, "Growth"),
    (24, 25, "Aggressive"),
]

ALLOCATION_TABLE = {
    "Conservative": {"equity": 0.20, "debt": 0.60, "cash": 0.20},
    "Moderate":     {"equity": 0.45, "debt": 0.45, "cash": 0.10},
    "Balanced":     {"equity": 0.60, "debt": 0.35, "cash": 0.05},
    "Growth":       {"equity": 0.75, "debt": 0.20, "cash": 0.05},
    "Aggressive":   {"equity": 0.85, "debt": 0.10, "cash": 0.05},
}

# Assumed (not guaranteed) annual returns per asset class
EXPECTED_RETURNS = {"equity": 0.11, "debt": 0.065, "cash": 0.04}


def risk_score(answers: List[int]) -> int:
    """Sum of 5 questionnaire answers, each scored 1-5. Max 25."""
    if len(answers) != 5 or any(a < 1 or a > 5 for a in answers):
        raise ValueError("Expected exactly 5 answers, each scored 1-5")
    return sum(answers)


def risk_category(score: int) -> RiskCategory:
    for low, high, category in RISK_SCORE_BANDS:
        if low <= score <= high:
            return category  # type: ignore
    raise ValueError(f"Risk score {score} out of expected range (5-25)")


def allocation_for_category(category: RiskCategory) -> dict:
    return ALLOCATION_TABLE[category]


def blended_expected_return(allocation: dict) -> float:
    """Weighted average expected return given an allocation dict."""
    return round(sum(allocation[k] * EXPECTED_RETURNS[k] for k in allocation), 4)


# ---------------------------------------------------------------------------
# 8. Full profile calculation (assembly — still deterministic, no LLM)
# ---------------------------------------------------------------------------

@dataclass
class FinancialSnapshot:
    net_worth: float
    monthly_cash_flow: float
    savings_capacity: float
    emergency_fund_required: float
    risk_score: int
    risk_category: RiskCategory
    engine_version: str = ENGINE_VERSION


def compute_snapshot(monthly_income: float, monthly_expenses: float,
                      total_assets: float, total_liabilities: float,
                      risk_answers: List[int],
                      buffer_pct: float = 0.10) -> FinancialSnapshot:
    score = risk_score(risk_answers)
    category = risk_category(score)
    return FinancialSnapshot(
        net_worth=net_worth(total_assets, total_liabilities),
        monthly_cash_flow=monthly_cash_flow(monthly_income, monthly_expenses),
        savings_capacity=savings_capacity(monthly_income, monthly_expenses, buffer_pct),
        emergency_fund_required=emergency_fund_requirement(monthly_expenses),
        risk_score=score,
        risk_category=category,
    )


@dataclass
class PlanResult:
    plan_name: str
    risk_level: str
    allocation: dict
    expected_cagr: float
    monthly_investment_needed: float
    projected_corpus: float
    goal_fv: float
    funded_pct: float


def generate_plan(target_present_cost: float, years: float, allocation: dict,
                   plan_name: str, risk_level: str,
                   inflation_rate: float = 0.06) -> PlanResult:
    """
    Build one deterministic plan object: inflate the goal, work out the
    blended return for the given allocation, and back-solve the SIP needed.
    """
    fv_goal = goal_future_value(target_present_cost, years, inflation_rate)
    cagr = blended_expected_return(allocation)
    sip_needed = required_sip(fv_goal, cagr, years)
    projected_corpus = sip_future_value(sip_needed, cagr, years)
    funded_pct = round(min(projected_corpus / fv_goal, 1.5) * 100, 1) if fv_goal else 0.0

    return PlanResult(
        plan_name=plan_name,
        risk_level=risk_level,
        allocation=allocation,
        expected_cagr=round(cagr * 100, 2),
        monthly_investment_needed=sip_needed,
        projected_corpus=projected_corpus,
        goal_fv=fv_goal,
        funded_pct=funded_pct,
    )


def generate_three_plans(target_present_cost: float, years: float,
                          inflation_rate: float = 0.06) -> List[PlanResult]:
    """
    Standard 3-plan comparison: Conservative / Balanced / Growth,
    regardless of the customer's own risk category (used for the
    side-by-side comparison screen).
    """
    plan_defs = [
        ("Conservative Plan", "Low", ALLOCATION_TABLE["Conservative"]),
        ("Balanced Plan", "Medium", ALLOCATION_TABLE["Balanced"]),
        ("Growth Plan", "High", ALLOCATION_TABLE["Aggressive"]),
    ]
    return [
        generate_plan(target_present_cost, years, alloc, name, risk, inflation_rate)
        for name, risk, alloc in plan_defs
    ]

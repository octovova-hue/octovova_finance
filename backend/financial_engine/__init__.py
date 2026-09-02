"""
financial_engine/__init__.py
----------------------------
Re-exports from the deterministic engine for clean imports.
"""

from financial_engine.financial_engine import (  # noqa: F401
    ENGINE_VERSION,
    ALLOCATION_TABLE,
    EXPECTED_RETURNS,
    RISK_SCORE_BANDS,
    FinancialSnapshot,
    PlanResult,
    net_worth,
    monthly_cash_flow,
    savings_capacity,
    emergency_fund_requirement,
    goal_future_value,
    compound_growth,
    sip_future_value,
    required_sip,
    retirement_corpus,
    risk_score,
    risk_category,
    allocation_for_category,
    blended_expected_return,
    compute_snapshot,
    generate_plan,
    generate_three_plans,
)

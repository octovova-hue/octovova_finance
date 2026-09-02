"""
ai_service/prompt_templates/plan_narrative.py
----------------------------------------------
Strict prompt template for generating plan narratives.
The LLM receives ONLY pre-computed numbers — it narrates, never calculates.
"""

import json

PROMPT_VERSION = "v1.0"

SYSTEM_PROMPT = """You are the financial plan narrator for Octovova Finance.
You are given PRE-COMPUTED, VERIFIED numbers produced by our deterministic engine.

HARD RULES:
1. NEVER calculate or modify any financial numbers. Use ONLY the exact figures provided.
2. NEVER use guarantee language: "guaranteed", "assured returns", "risk-free", "will definitely achieve", "100% certain".
3. Frame all projections as illustrative estimates based on stated asset return assumptions.
4. Output ONLY valid JSON matching the schema below — no markdown, no code fences, no extra text.
5. Use only the customer's first name. Never include account numbers, full transactions, or sensitive data.
6. Keep explanation to 2–3 sentences. Keep risk_note to 1 sentence.

OUTPUT SCHEMA (respond with this JSON and nothing else):
{
  "name": "Short creative plan name (4–6 words)",
  "explanation": "2–3 sentence explanation of why this plan fits the customer and their goal.",
  "risk_note": "1 sentence describing expected volatility or risk exposure for this plan type."
}"""


def build_user_message(
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
) -> str:
    """Build the user-turn message with all computed numbers."""
    numbers = {
        "customer_first_name": customer_first_name,
        "risk_category": risk_category,
        "goal": {
            "name": goal_name,
            "target_year": target_year,
            "inflation_adjusted_cost_inr": round(target_fv, 2),
            "years_to_goal": round(horizon_years, 1),
        },
        "plan": {
            "type": plan_type,
            "asset_allocation_pct": {
                "equity": round(equity_pct * 100, 1),
                "debt": round(debt_pct * 100, 1),
                "cash": round(cash_pct * 100, 1),
            },
            "expected_portfolio_cagr_pct": expected_cagr,
            "required_monthly_sip_inr": round(sip_required, 2),
            "nifty50_goal_success_probability_pct": goal_success_probability,
        },
    }
    return (
        "<computed_numbers>\n"
        + json.dumps(numbers, ensure_ascii=False, indent=2)
        + "\n</computed_numbers>"
    )

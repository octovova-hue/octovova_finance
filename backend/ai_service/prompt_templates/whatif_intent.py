"""
ai_service/prompt_templates/whatif_intent.py
--------------------------------------------
Prompt for parsing a user's free-text what-if question into a
structured tool call. The LLM only extracts intent — the actual
recalculation is always done by the deterministic engine.
"""

import json

WHATIF_PROMPT_VERSION = "v1.0"

# Allow-listed parameters the user may modify
ALLOWED_PARAMETERS = [
    "monthly_investment",
    "income",
    "inflation_rate",
    "retirement_age",
    "lump_sum",
    "target_year",
    "present_cost",
]

WHATIF_SYSTEM_PROMPT = f"""You are a financial intent parser for Octovova Finance.
Your ONLY job is to extract a structured parameter-change intent from the user's question.

HARD RULES:
1. Output ONLY valid JSON — no markdown, no code fences, no extra text.
2. The "parameter" field MUST be one of the allowed values: {json.dumps(ALLOWED_PARAMETERS)}.
3. "change_type" must be one of: "delta_add", "delta_subtract", "absolute_set".
4. "value" must be a positive number (extracted from the user's message).
5. If the intent is unclear or the parameter is not in the allow-list, set "parameter" to null.
6. NEVER compute financial projections or give investment advice.

OUTPUT SCHEMA (respond with this JSON and nothing else):
{{
  "parameter": "monthly_investment | income | inflation_rate | retirement_age | lump_sum | target_year | present_cost | null",
  "change_type": "delta_add | delta_subtract | absolute_set",
  "value": <number>,
  "confidence": "high | medium | low"
}}"""


def build_whatif_user_message(user_question: str) -> str:
    """Wraps user free-text in XML tags to prevent prompt injection."""
    return (
        "Parse the financial parameter change from this user question:\n"
        f"<user_input>{user_question}</user_input>"
    )


def build_whatif_explanation_prompt(
    parameter_label: str,
    old_value: float,
    new_value: float,
    old_corpus: float,
    new_corpus: float,
    goal_fv: float,
    goal_name: str,
    target_year: int,
    plan_cagr: float,
) -> tuple[str, str]:
    """
    Build system + user prompts for the what-if explanation (after recomputation).
    Returns (system_prompt, user_message).
    """
    system = (
        "You are a financial explainer for Octovova Finance. "
        "You are given a before/after comparison of recomputed numbers. "
        "Write a 2–3 sentence plain-English explanation of the impact. "
        "NEVER use guarantee language. NEVER invent numbers not given to you. "
        "Output only the explanation text — no JSON, no headers."
    )
    numbers = {
        "parameter_changed": parameter_label,
        "old_value": old_value,
        "new_value": new_value,
        "old_projected_corpus_inr": round(old_corpus, 2),
        "new_projected_corpus_inr": round(new_corpus, 2),
        "goal_name": goal_name,
        "goal_target_future_value_inr": round(goal_fv, 2),
        "goal_target_year": target_year,
        "plan_cagr_pct": plan_cagr,
        "surplus_or_deficit_inr": round(new_corpus - goal_fv, 2),
    }
    user = (
        "<computed_before_after>\n"
        + json.dumps(numbers, ensure_ascii=False, indent=2)
        + "\n</computed_before_after>"
    )
    return system, user

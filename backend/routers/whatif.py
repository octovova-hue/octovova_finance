"""
routers/whatif.py
-----------------
POST /customers/{id}/plans/{plan_id}/what-if

What-If pipeline:
  1. LLM parses user free-text → structured intent (parameter, change_type, value)
  2. Allow-list check — only whitelisted parameters permitted
  3. Deterministic engine recomputes the scenario
  4. LLM narrates the before/after delta (numbers come from step 3, not LLM)
  5. Log to what_if_log table
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import financial_engine.financial_engine as fe
from ai_service import orchestrator as ai
from ai_service.prompt_templates.whatif_intent import ALLOWED_PARAMETERS
from core.config import settings
from core.security import get_current_user
from db.models import FinancialGoal, FinancialPlan, WhatIfLog
from db.session import get_db

router = APIRouter(prefix="/customers", tags=["whatif"])

CURRENT_YEAR = 2026


class WhatIfRequest(BaseModel):
    question: str


@router.post("/{customer_id}/plans/{plan_id}/what-if")
async def what_if(
    customer_id: str,
    plan_id: str,
    req: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if len(req.question) > 500:
        raise HTTPException(status_code=422, detail="Question must be ≤ 500 characters")

    # Load plan + goal
    plan = (
        await db.execute(
            select(FinancialPlan).where(
                FinancialPlan.plan_id == plan_id,
                FinancialPlan.customer_id == customer_id,
            )
        )
    ).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    goal = None
    if plan.goal_id:
        goal = (await db.execute(select(FinancialGoal).where(FinancialGoal.goal_id == plan.goal_id))).scalar_one_or_none()

    current_sip   = float(plan.monthly_investment_required)
    goal_fv       = float(plan.goal_fv) if plan.goal_fv else 0.0
    plan_cagr     = float(plan.expected_cagr)
    horizon_years = (goal.target_year - CURRENT_YEAR) if goal else 10
    goal_name     = (goal.goal_name or goal.goal_type) if goal else "your goal"
    target_year   = goal.target_year if goal else CURRENT_YEAR + horizon_years
    infl          = float(goal.inflation_rate) if goal else settings.default_inflation_rate
    today_cost    = float(goal.today_cost) if goal else goal_fv

    # ── Step 1: LLM intent parsing ─────────────────────────────────────────────
    intent, intent_status = await ai.parse_whatif_intent(req.question)

    if intent_status == "failed" or intent is None or intent.get("parameter") is None:
        # Fallback: treat as SIP delta add of 10 000
        intent = {"parameter": "monthly_investment", "change_type": "delta_add", "value": 10_000, "confidence": "low"}

    parameter   = intent["parameter"]
    change_type = intent["change_type"]
    value       = float(intent["value"])

    # ── Step 2: Allow-list check ────────────────────────────────────────────────
    if parameter not in ALLOWED_PARAMETERS:
        raise HTTPException(
            status_code=422,
            detail=f"Parameter '{parameter}' is not on the what-if allow-list. "
                   f"Allowed: {ALLOWED_PARAMETERS}",
        )

    # ── Step 3: Deterministic recomputation ────────────────────────────────────
    old_corpus = fe.sip_future_value(current_sip, plan_cagr / 100, horizon_years)

    new_sip          = current_sip
    new_horizon      = horizon_years
    new_goal_fv      = goal_fv
    new_infl         = infl
    new_today_cost   = today_cost
    param_label      = parameter
    old_param_val    = current_sip
    new_param_val    = current_sip

    if parameter == "monthly_investment":
        old_param_val = current_sip
        if change_type == "delta_add":
            new_sip = current_sip + value
        elif change_type == "delta_subtract":
            new_sip = max(0.0, current_sip - value)
        else:
            new_sip = value
        new_param_val = new_sip
        param_label = "Monthly Investment (SIP)"

    elif parameter == "inflation_rate":
        old_param_val = round(infl * 100, 2)
        new_infl = value / 100 if value > 1 else value
        new_param_val = round(new_infl * 100, 2)
        new_goal_fv   = fe.goal_future_value(today_cost, horizon_years, new_infl)
        new_sip       = fe.required_sip(new_goal_fv, plan_cagr / 100, horizon_years)
        param_label   = "Inflation Rate (%)"

    elif parameter == "target_year":
        old_param_val = target_year
        new_target    = int(value) if change_type == "absolute_set" else int(target_year + value)
        new_horizon   = max(1, new_target - CURRENT_YEAR)
        new_goal_fv   = fe.goal_future_value(today_cost, new_horizon, infl)
        new_sip       = fe.required_sip(new_goal_fv, plan_cagr / 100, new_horizon)
        new_param_val = new_target
        param_label   = "Target Year"

    elif parameter == "present_cost":
        old_param_val  = today_cost
        new_today_cost = value if change_type == "absolute_set" else today_cost + value
        new_goal_fv    = fe.goal_future_value(new_today_cost, horizon_years, infl)
        new_sip        = fe.required_sip(new_goal_fv, plan_cagr / 100, horizon_years)
        new_param_val  = new_today_cost
        param_label    = "Goal Present Cost (₹)"

    elif parameter == "income":
        old_param_val = value  # approximate
        new_param_val = value
        new_sip       = current_sip   # income change doesn't affect SIP math directly
        param_label   = "Monthly Income (₹)"

    elif parameter == "lump_sum":
        old_param_val = 0
        new_param_val = value
        # Lump sum reduces required SIP
        lump_sum_fv  = fe.compound_growth(value, plan_cagr / 100, horizon_years)
        remaining_fv = max(0.0, goal_fv - lump_sum_fv)
        new_sip      = fe.required_sip(remaining_fv, plan_cagr / 100, horizon_years) if remaining_fv > 0 else 0.0
        param_label  = "Lump Sum Investment (₹)"

    elif parameter == "retirement_age":
        old_param_val = target_year
        new_target    = CURRENT_YEAR + int(value) - 35  # rough age→year approximation
        new_horizon   = max(1, new_target - CURRENT_YEAR)
        new_goal_fv   = fe.goal_future_value(today_cost, new_horizon, infl)
        new_sip       = fe.required_sip(new_goal_fv, plan_cagr / 100, new_horizon)
        new_param_val = value
        param_label   = "Retirement Age"

    new_corpus  = fe.sip_future_value(new_sip, plan_cagr / 100, new_horizon or horizon_years)
    surplus     = round(new_corpus - new_goal_fv, 2)

    recomputed = {
        "current_monthly_investment": round(current_sip, 2),
        "new_monthly_investment": round(new_sip, 2),
        "delta_investment_monthly": round(new_sip - current_sip, 2),
        "projected_portfolio_value": round(new_corpus, 2),
        "target_future_value": round(new_goal_fv, 2),
        "surplus_projected": surplus,
    }

    # ── Step 4: LLM explanation (numbers from step 3, not LLM) ────────────────
    explanation = await ai.generate_whatif_explanation(
        parameter_label=param_label,
        old_value=old_param_val,
        new_value=new_param_val,
        old_corpus=round(old_corpus, 2),
        new_corpus=round(new_corpus, 2),
        goal_fv=round(new_goal_fv, 2),
        goal_name=goal_name,
        target_year=target_year,
        plan_cagr=plan_cagr,
    )

    result_json = {
        "parsed_intent": intent,
        "recomputed": recomputed,
        "explanation": explanation,
    }

    # ── Step 5: Log ────────────────────────────────────────────────────────────
    db.add(WhatIfLog(
        customer_id=customer_id,
        plan_id=plan_id,
        question_text=req.question,
        parsed_intent=intent,
        result_json=result_json,
    ))
    await db.commit()

    return result_json

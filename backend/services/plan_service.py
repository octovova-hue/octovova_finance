"""
services/plan_service.py
------------------------
Core plan-generation orchestration (the most important service).

Pipeline (in order, matching the architecture spec):
  1. financial_engine     → net worth, cash flow, savings capacity, SIP, FV
  2. allocation_rules     → conflict checks, 3-plan allocations
  3. monte_carlo_client   → goal_success_probability per plan (GET from HF Space)
  4. ai_service/orchestrator → plan narrative (JSON: name, explanation, risk_note)
  5. ai_service/validators → validate each narrative (schema + numeric + banned)
  6. Persist              → financial_plan, plan_allocation, ai_recommendation
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import financial_engine.financial_engine as fe
from db.models import AiRecommendation, Asset, Customer, Expense, FinancialGoal, FinancialPlan, Income, Liability, PlanAllocation, RiskAssessment
from financial_engine.allocation_rules import (
    THREE_PLAN_DEFS,
    ConflictFlags,
    build_three_plans,
    check_conflicts,
)
from financial_engine.monte_carlo_client import fetch_monte_carlo
from ai_service import orchestrator as ai
from ai_service.prompt_templates.plan_narrative import PROMPT_VERSION
from core.config import settings

log = logging.getLogger(__name__)

CURRENT_YEAR = 2026


async def _load_snapshot_data(db: AsyncSession, customer_id: str) -> dict:
    """Load aggregated financial data from DB."""
    incomes     = (await db.execute(select(Income).where(Income.customer_id == customer_id))).scalars().all()
    expenses    = (await db.execute(select(Expense).where(Expense.customer_id == customer_id))).scalars().all()
    assets_rows = (await db.execute(select(Asset).where(Asset.customer_id == customer_id))).scalars().all()
    liab_rows   = (await db.execute(select(Liability).where(Liability.customer_id == customer_id))).scalars().all()

    total_income      = sum(float(i.monthly_amount) for i in incomes)
    total_expenses    = sum(float(e.monthly_amount) for e in expenses)
    total_assets      = sum(float(a.current_value) for a in assets_rows)
    total_liabilities = sum(float(l.outstanding_amount) for l in liab_rows)
    liquid_types      = {"cash", "fd", "fixed deposit", "liquid fund"}
    liquid_assets     = sum(float(a.current_value) for a in assets_rows if a.type.lower() in liquid_types)

    return dict(
        total_income=total_income,
        total_expenses=total_expenses,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        liquid_assets=liquid_assets,
    )


async def generate_plans(
    db: AsyncSession,
    customer_id: str,
    goal_ids: list[str] | None = None,
    inflation_rate: float | None = None,
) -> dict:
    """
    Full plan-generation pipeline for one or more goals.
    If goal_ids is provided, generates plans for each goal.
    If None / empty, uses the highest-priority goal.
    Returns assembled response dict ready for the frontend.
    """
    # ── Load customer ──────────────────────────────────────────────────────────
    customer = (await db.execute(select(Customer).where(Customer.customer_id == customer_id))).scalar_one_or_none()
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    first_name = (customer.name or "").split()[0] if customer.name else "there"

    # ── Load latest risk assessment ────────────────────────────────────────────
    risk_row = (
        await db.execute(
            select(RiskAssessment)
            .where(RiskAssessment.customer_id == customer_id)
            .order_by(RiskAssessment.assessed_at.desc())
        )
    ).scalars().first()
    risk_category = risk_row.category if risk_row else "Balanced"

    # ── Load financial snapshot ────────────────────────────────────────────────
    snap = await _load_snapshot_data(db, customer_id)
    savings_cap = fe.savings_capacity(snap["total_income"], snap["total_expenses"], settings.default_buffer_pct)

    # ── Resolve goals ──────────────────────────────────────────────────────────
    if goal_ids:
        q = select(FinancialGoal).where(
            FinancialGoal.customer_id == customer_id,
            FinancialGoal.goal_id.in_(goal_ids),
        )
    else:
        # Use highest-priority goal
        q = (
            select(FinancialGoal)
            .where(FinancialGoal.customer_id == customer_id)
            .order_by(FinancialGoal.priority.desc(), FinancialGoal.created_at)
            .limit(1)
        )
    goals = (await db.execute(q)).scalars().all()
    if not goals:
        raise ValueError("No goals found. Add a goal before generating plans.")

    response_goals = []

    for goal in goals:
        infl = inflation_rate if inflation_rate is not None else float(goal.inflation_rate or settings.default_inflation_rate)
        horizon_years = goal.target_year - CURRENT_YEAR
        if horizon_years <= 0:
            horizon_years = 1

        goal_fv = fe.goal_future_value(float(goal.today_cost), horizon_years, infl)

        # ── Step 1: Build 3 deterministic plans ───────────────────────────────
        plan_results = build_three_plans(
            today_cost=float(goal.today_cost),
            horizon_years=horizon_years,
            inflation_rate=infl,
            existing_dedicated_assets=0.0,
        )

        # ── Step 2: Conflict checks ────────────────────────────────────────────
        conflicts: ConflictFlags = check_conflicts(
            monthly_income=snap["total_income"],
            monthly_expenses=snap["total_expenses"],
            total_liquid_assets=snap["liquid_assets"],
            existing_dedicated_assets=0.0,
            goal_fv=goal_fv,
            required_sip=plan_results[1].monthly_investment_needed,  # balanced plan
            savings_capacity=savings_cap,
            horizon_years=horizon_years,
        )

        plans_out = []
        for idx, pr in enumerate(plan_results):
            plan_type = THREE_PLAN_DEFS[idx][1]  # 'conservative' | 'balanced' | 'growth'

            # ── Step 3: Monte Carlo ────────────────────────────────────────────
            mc_data = await fetch_monte_carlo(horizon_years, pr.expected_cagr)
            goal_success_prob = mc_data.get("goal_success_probability", 50.0)

            # ── Step 4 & 5: LLM narrative + validation ─────────────────────────
            narrative, validation_status = await ai.generate_plan_narrative(
                customer_first_name=first_name,
                risk_category=risk_category,
                goal_name=goal.goal_name or goal.goal_type,
                target_year=goal.target_year,
                target_fv=goal_fv,
                plan_type=plan_type,
                equity_pct=pr.allocation["equity"],
                debt_pct=pr.allocation["debt"],
                cash_pct=pr.allocation["cash"],
                expected_cagr=pr.expected_cagr,
                sip_required=pr.monthly_investment_needed,
                goal_success_probability=goal_success_prob,
                horizon_years=horizon_years,
            )

            # ── Step 6: Persist ────────────────────────────────────────────────
            db_plan = FinancialPlan(
                customer_id=customer_id,
                goal_id=goal.goal_id,
                plan_type=plan_type,
                plan_name=narrative.get("name", plan_type.capitalize()),
                expected_cagr=pr.expected_cagr,
                monthly_investment_required=pr.monthly_investment_needed,
                goal_fv=goal_fv,
                projected_corpus=pr.projected_corpus,
                funded_pct=pr.funded_pct,
                goal_success_probability=goal_success_prob,
                engine_version=fe.ENGINE_VERSION,
                is_selected=(plan_type == "balanced"),  # balanced pre-selected
                has_conflict=conflicts.has_conflict,
                conflict_flags=conflicts.to_dict(),
            )
            db.add(db_plan)
            await db.flush()

            for asset_class, pct in pr.allocation.items():
                db.add(PlanAllocation(
                    plan_id=db_plan.plan_id,
                    asset_class=asset_class,
                    percentage=round(pct * 100, 2),
                ))

            db.add(AiRecommendation(
                plan_id=db_plan.plan_id,
                narrative_name=narrative.get("name"),
                narrative_text=narrative.get("explanation", ""),
                risk_note=narrative.get("risk_note", ""),
                model_version=settings.llm_hub_model,
                prompt_version=PROMPT_VERSION,
                validation_status=validation_status,
            ))

            plans_out.append({
                "plan_id": db_plan.plan_id,
                "type": plan_type,
                "name": narrative.get("name"),
                "allocation": {
                    "equity": round(pr.allocation["equity"] * 100),
                    "debt": round(pr.allocation["debt"] * 100),
                    "cash": round(pr.allocation["cash"] * 100),
                },
                "expected_cagr": pr.expected_cagr,
                "monthly_investment_required": round(pr.monthly_investment_needed, 2),
                "projected_corpus": pr.projected_corpus,
                "goal_fv": goal_fv,
                "funded_pct": pr.funded_pct,
                "goal_success_probability": goal_success_prob,
                "mc_horizon_used": mc_data.get("horizon_used"),
                "narrative": {
                    "name": narrative.get("name"),
                    "explanation": narrative.get("explanation"),
                    "risk_note": narrative.get("risk_note"),
                },
                "is_selected": plan_type == "balanced",
                "validation_status": validation_status,
            })

        response_goals.append({
            "goal_id": goal.goal_id,
            "goal_name": goal.goal_name or goal.goal_type,
            "goal_fv": goal_fv,
            "horizon_years": horizon_years,
            "conflicts": conflicts.to_dict(),
            "plans": plans_out,
        })

    await db.commit()
    return {
        "customer_id": customer_id,
        "goals": response_goals,
        # Flatten plans for single-goal convenience (first goal)
        "plans": response_goals[0]["plans"] if len(response_goals) == 1 else [],
    }


async def list_plans(db: AsyncSession, customer_id: str) -> list[dict]:
    """Return all persisted plans for a customer (with latest recommendation)."""
    plans = (
        await db.execute(
            select(FinancialPlan)
            .where(FinancialPlan.customer_id == customer_id)
            .order_by(FinancialPlan.generated_at.desc())
        )
    ).scalars().all()

    out = []
    for p in plans:
        allocs = (await db.execute(select(PlanAllocation).where(PlanAllocation.plan_id == p.plan_id))).scalars().all()
        rec = (
            await db.execute(
                select(AiRecommendation)
                .where(AiRecommendation.plan_id == p.plan_id)
                .order_by(AiRecommendation.generated_at.desc())
                .limit(1)
            )
        ).scalars().first()

        out.append({
            "plan_id": p.plan_id,
            "goal_id": p.goal_id,
            "type": p.plan_type,
            "name": p.plan_name,
            "expected_cagr": float(p.expected_cagr),
            "monthly_investment_required": float(p.monthly_investment_required),
            "goal_fv": float(p.goal_fv) if p.goal_fv else None,
            "projected_corpus": float(p.projected_corpus) if p.projected_corpus else None,
            "funded_pct": float(p.funded_pct) if p.funded_pct else None,
            "goal_success_probability": float(p.goal_success_probability) if p.goal_success_probability else None,
            "is_selected": p.is_selected,
            "generated_at": p.generated_at.isoformat(),
            "allocation": {a.asset_class: float(a.percentage) for a in allocs},
            "narrative": {
                "name": rec.narrative_name if rec else None,
                "explanation": rec.narrative_text if rec else None,
                "risk_note": rec.risk_note if rec else None,
            } if rec else None,
        })
    return out


async def select_plan(db: AsyncSession, customer_id: str, plan_id: str) -> bool:
    """Mark plan as selected; deselect all others for same customer."""
    plans = (
        await db.execute(select(FinancialPlan).where(FinancialPlan.customer_id == customer_id))
    ).scalars().all()
    found = False
    for p in plans:
        p.is_selected = p.plan_id == plan_id
        if p.plan_id == plan_id:
            found = True
    await db.commit()
    return found


async def get_plan_with_explanation(db: AsyncSession, customer_id: str, plan_id: str) -> dict | None:
    plan = (
        await db.execute(
            select(FinancialPlan).where(
                FinancialPlan.plan_id == plan_id,
                FinancialPlan.customer_id == customer_id,
            )
        )
    ).scalar_one_or_none()
    if not plan:
        return None

    allocs = (await db.execute(select(PlanAllocation).where(PlanAllocation.plan_id == plan_id))).scalars().all()
    rec = (
        await db.execute(
            select(AiRecommendation)
            .where(AiRecommendation.plan_id == plan_id)
            .order_by(AiRecommendation.generated_at.desc())
            .limit(1)
        )
    ).scalars().first()

    return {
        "plan_id": plan.plan_id,
        "goal_id": plan.goal_id,
        "type": plan.plan_type,
        "name": plan.plan_name,
        "expected_cagr": float(plan.expected_cagr),
        "monthly_investment_required": float(plan.monthly_investment_required),
        "goal_fv": float(plan.goal_fv) if plan.goal_fv else None,
        "projected_corpus": float(plan.projected_corpus) if plan.projected_corpus else None,
        "funded_pct": float(plan.funded_pct) if plan.funded_pct else None,
        "goal_success_probability": float(plan.goal_success_probability) if plan.goal_success_probability else None,
        "is_selected": plan.is_selected,
        "conflict_flags": plan.conflict_flags,
        "allocation": {a.asset_class: float(a.percentage) for a in allocs},
        "narrative": {
            "name": rec.narrative_name,
            "explanation": rec.narrative_text,
            "risk_note": rec.risk_note,
            "model_version": rec.model_version,
            "validation_status": rec.validation_status,
        } if rec else None,
    }

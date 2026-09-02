"""
services/goal_service.py
------------------------
CRUD for FinancialGoal + inflation-adjusted FV preview.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import financial_engine.financial_engine as fe
from core.config import settings
from db.models import FinancialGoal


async def create_goal(
    db: AsyncSession,
    customer_id: str,
    goal_type: str,
    target_year: int,
    today_cost: float,
    priority: int = 3,
    inflation_rate: float | None = None,
    goal_name: str | None = None,
    current_year: int = 2026,
) -> dict:
    infl = inflation_rate if inflation_rate is not None else settings.default_inflation_rate
    years = target_year - current_year
    fv = fe.goal_future_value(today_cost, years, infl) if years > 0 else today_cost

    goal = FinancialGoal(
        customer_id=customer_id,
        goal_type=goal_type,
        target_year=target_year,
        today_cost=today_cost,
        priority=priority,
        inflation_rate=infl,
        goal_name=goal_name or goal_type,
    )
    db.add(goal)
    await db.flush()

    return {
        "goal_id": goal.goal_id,
        "goal_type": goal.goal_type,
        "goal_name": goal.goal_name,
        "target_year": goal.target_year,
        "today_cost": today_cost,
        "inflation_adjusted_fv": fv,
        "years_to_goal": years,
        "priority": goal.priority,
    }


async def list_goals(db: AsyncSession, customer_id: str) -> list[dict]:
    result = await db.execute(
        select(FinancialGoal)
        .where(FinancialGoal.customer_id == customer_id)
        .order_by(FinancialGoal.priority.desc(), FinancialGoal.created_at)
    )
    goals = result.scalars().all()
    current_year = 2026
    out = []
    for g in goals:
        years = g.target_year - current_year
        fv = fe.goal_future_value(float(g.today_cost), years, float(g.inflation_rate)) if years > 0 else float(g.today_cost)
        out.append({
            "goal_id": g.goal_id,
            "goal_type": g.goal_type,
            "goal_name": g.goal_name,
            "target_year": g.target_year,
            "today_cost": float(g.today_cost),
            "inflation_adjusted_fv": fv,
            "years_to_goal": years,
            "priority": g.priority,
        })
    return out

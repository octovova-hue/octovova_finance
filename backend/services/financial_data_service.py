"""
services/financial_data_service.py
------------------------------------
Aggregates DB records and runs the deterministic engine to compute
the live financial snapshot (net worth, cash flow, savings capacity,
emergency fund).  No LLM, no randomness — pure functions.
"""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import financial_engine.financial_engine as fe
from core.config import settings
from db.models import Asset, Expense, Income, Liability


async def get_financial_snapshot(db: AsyncSession, customer_id: str) -> dict:
    """
    Pull all income/expense/asset/liability rows and compute deterministic snapshot.
    Returns a dict matching GET /customers/{id}/networth response schema.
    """
    incomes    = (await db.execute(select(Income).where(Income.customer_id == customer_id))).scalars().all()
    expenses   = (await db.execute(select(Expense).where(Expense.customer_id == customer_id))).scalars().all()
    assets     = (await db.execute(select(Asset).where(Asset.customer_id == customer_id))).scalars().all()
    liabilities= (await db.execute(select(Liability).where(Liability.customer_id == customer_id))).scalars().all()

    total_income     = sum(float(i.monthly_amount) for i in incomes)
    total_expenses   = sum(float(e.monthly_amount) for e in expenses)
    total_assets     = sum(float(a.current_value) for a in assets)
    total_liabilities= sum(float(l.outstanding_amount) for l in liabilities)

    # Liquid assets = Cash + Fixed Deposit (used for emergency fund check)
    liquid_types = {"cash", "fd", "fixed deposit", "liquid fund"}
    liquid_assets = sum(
        float(a.current_value) for a in assets
        if a.type.lower() in liquid_types
    )

    nw    = fe.net_worth(total_assets, total_liabilities)
    cf    = fe.monthly_cash_flow(total_income, total_expenses)
    cap   = fe.savings_capacity(total_income, total_expenses, settings.default_buffer_pct)
    emerg = fe.emergency_fund_requirement(total_expenses, settings.default_emergency_months)

    return {
        "net_worth": nw,
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "cash_flow": cf,
        "savings_capacity": cap,
        "emergency_fund_required": emerg,
        "liquid_assets_available": round(liquid_assets, 2),
        "is_cash_flow_negative": cf < 0,
        "is_emergency_fund_adequate": liquid_assets >= emerg,
        "total_monthly_income": round(total_income, 2),
        "total_monthly_expenses": round(total_expenses, 2),
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }

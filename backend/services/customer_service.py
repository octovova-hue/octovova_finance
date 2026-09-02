"""
services/customer_service.py
-----------------------------
CRUD operations for Customer, Income, Expense, Asset, Liability.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password
from db.models import Asset, Customer, Expense, Income, Liability


async def create_customer(db: AsyncSession, email: str, password: str) -> Customer:
    customer = Customer(email=email, password_hash=hash_password(password))
    db.add(customer)
    await db.flush()
    return customer


async def get_customer_by_email(db: AsyncSession, email: str) -> Customer | None:
    result = await db.execute(select(Customer).where(Customer.email == email))
    return result.scalar_one_or_none()


async def get_customer_by_id(db: AsyncSession, customer_id: str) -> Customer | None:
    result = await db.execute(select(Customer).where(Customer.customer_id == customer_id))
    return result.scalar_one_or_none()


async def update_customer_profile(db: AsyncSession, customer_id: str, name: str, age: int) -> Customer | None:
    customer = await get_customer_by_id(db, customer_id)
    if not customer:
        return None
    customer.name = name
    customer.age = age
    await db.flush()
    return customer


async def upsert_financial_profile(
    db: AsyncSession,
    customer_id: str,
    incomes: list[dict],
    expenses: list[dict],
    assets: list[dict],
    liabilities: list[dict],
) -> None:
    """Replace all income/expense/asset/liability records for the customer."""
    # Delete existing
    for model in (Income, Expense, Asset, Liability):
        existing = await db.execute(
            select(model).where(model.customer_id == customer_id)  # type: ignore[attr-defined]
        )
        for row in existing.scalars():
            await db.delete(row)

    # Insert new
    for inc in incomes:
        db.add(Income(customer_id=customer_id, source=inc["source"], monthly_amount=inc["monthly_amount"]))
    for exp in expenses:
        db.add(Expense(customer_id=customer_id, category=exp["category"], monthly_amount=exp["monthly_amount"]))
    for ast in assets:
        db.add(Asset(customer_id=customer_id, type=ast["type"], current_value=ast["current_value"]))
    for liab in liabilities:
        db.add(Liability(
            customer_id=customer_id,
            type=liab["type"],
            outstanding_amount=liab["outstanding_amount"],
            interest_rate=liab.get("interest_rate", 0.0),
        ))
    await db.flush()

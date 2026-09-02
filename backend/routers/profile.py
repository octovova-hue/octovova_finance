"""
routers/profile.py
------------------
POST /customers/{id}/profile
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import customer_service as cs

router = APIRouter(prefix="/customers", tags=["profile"])


class IncomeItem(BaseModel):
    source: str
    monthly_amount: float


class ExpenseItem(BaseModel):
    category: str
    monthly_amount: float


class AssetItem(BaseModel):
    type: str
    current_value: float


class LiabilityItem(BaseModel):
    type: str
    outstanding_amount: float
    interest_rate: float = 0.0


class ProfileRequest(BaseModel):
    incomes: list[IncomeItem] = []
    expenses: list[ExpenseItem] = []
    assets: list[AssetItem] = []
    liabilities: list[LiabilityItem] = []


@router.post("/{customer_id}/profile", status_code=200)
async def upsert_profile(
    customer_id: str,
    req: ProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await cs.upsert_financial_profile(
        db,
        customer_id,
        incomes=[i.model_dump() for i in req.incomes],
        expenses=[e.model_dump() for e in req.expenses],
        assets=[a.model_dump() for a in req.assets],
        liabilities=[l.model_dump() for l in req.liabilities],
    )
    await db.commit()
    return {"status": "ok", "customer_id": customer_id}

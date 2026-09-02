"""
routers/plans.py
----------------
POST /customers/{id}/plans/generate
GET  /customers/{id}/plans/compare
POST /customers/{id}/plans/{plan_id}/select
GET  /customers/{id}/plans/{plan_id}/explain
GET  /customers/{id}/plans
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import plan_service as ps

router = APIRouter(prefix="/customers", tags=["plans"])


class GeneratePlansRequest(BaseModel):
    goal_ids: list[str] | None = None       # None = highest-priority goal
    inflation_rate: float | None = None     # None = use goal's stored rate


@router.post("/{customer_id}/plans/generate", status_code=201)
async def generate_plans(
    customer_id: str,
    req: GeneratePlansRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        result = await ps.generate_plans(
            db,
            customer_id=customer_id,
            goal_ids=req.goal_ids,
            inflation_rate=req.inflation_rate,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.get("/{customer_id}/plans/compare")
async def compare_plans(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    plans = await ps.list_plans(db, customer_id)
    return {"customer_id": customer_id, "plans": plans}


@router.get("/{customer_id}/plans")
async def list_plans(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return await ps.list_plans(db, customer_id)


@router.post("/{customer_id}/plans/{plan_id}/select")
async def select_plan(
    customer_id: str,
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    found = await ps.select_plan(db, customer_id, plan_id)
    if not found:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"status": "selected", "plan_id": plan_id}


@router.get("/{customer_id}/plans/{plan_id}/explain")
async def explain_plan(
    customer_id: str,
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    plan = await ps.get_plan_with_explanation(db, customer_id, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

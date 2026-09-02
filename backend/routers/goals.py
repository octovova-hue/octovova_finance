"""
routers/goals.py
----------------
POST /customers/{id}/goals
GET  /customers/{id}/goals   (bonus list endpoint)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import goal_service as gs

router = APIRouter(prefix="/customers", tags=["goals"])


class GoalRequest(BaseModel):
    goal_type: str
    target_year: int
    today_cost: float
    priority: int = 3
    inflation_rate: float | None = None
    goal_name: str | None = None


@router.post("/{customer_id}/goals", status_code=201)
async def create_goal(
    customer_id: str,
    req: GoalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if req.target_year <= 2026:
        raise HTTPException(status_code=422, detail="target_year must be after 2026")
    if req.today_cost <= 0:
        raise HTTPException(status_code=422, detail="today_cost must be > 0")

    result = await gs.create_goal(
        db,
        customer_id=customer_id,
        goal_type=req.goal_type,
        target_year=req.target_year,
        today_cost=req.today_cost,
        priority=req.priority,
        inflation_rate=req.inflation_rate,
        goal_name=req.goal_name,
    )
    await db.commit()
    return result


@router.get("/{customer_id}/goals")
async def list_goals(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return await gs.list_goals(db, customer_id)

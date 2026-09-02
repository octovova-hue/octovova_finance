"""
routers/feedback.py
-------------------
POST /customers/{id}/feedback
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import feedback_service as fbs

router = APIRouter(prefix="/customers", tags=["feedback"])


class FeedbackRequest(BaseModel):
    rating: int
    comments: str | None = None
    plan_id: str | None = None


@router.post("/{customer_id}/feedback", status_code=201)
async def submit_feedback(
    customer_id: str,
    req: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not 1 <= req.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    return await fbs.submit_feedback(
        db,
        customer_id=customer_id,
        rating=req.rating,
        comments=req.comments,
        plan_id=req.plan_id,
    )

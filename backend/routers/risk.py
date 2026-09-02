"""
routers/risk.py
---------------
POST /customers/{id}/risk-assessment
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import risk_service as rs

router = APIRouter(prefix="/customers", tags=["risk"])


class RiskAssessmentRequest(BaseModel):
    answers: list[int]

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v: list[int]) -> list[int]:
        if len(v) != 5:
            raise ValueError("Exactly 5 answers required")
        if any(a < 1 or a > 5 for a in v):
            raise ValueError("Each answer must be between 1 and 5")
        return v


@router.post("/{customer_id}/risk-assessment", status_code=201)
async def submit_risk_assessment(
    customer_id: str,
    req: RiskAssessmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        assessment = await rs.submit_risk_assessment(db, customer_id, req.answers)
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {
        "assessment_id": assessment.assessment_id,
        "score": assessment.score,
        "category": assessment.category,
        "answers": req.answers,
    }

"""
services/risk_service.py
------------------------
Risk questionnaire scoring → category → persistence.
"""

from sqlalchemy.ext.asyncio import AsyncSession

import financial_engine.financial_engine as fe
from db.models import RiskAssessment


async def submit_risk_assessment(
    db: AsyncSession, customer_id: str, answers: list[int]
) -> RiskAssessment:
    score    = fe.risk_score(answers)
    category = fe.risk_category(score)

    assessment = RiskAssessment(
        customer_id=customer_id,
        answers={"answers": answers},
        score=score,
        category=category,
    )
    db.add(assessment)
    await db.flush()
    return assessment

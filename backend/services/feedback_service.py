"""
services/feedback_service.py
-----------------------------
Persists user feedback (star rating + optional comments).
"""

from sqlalchemy.ext.asyncio import AsyncSession

from db.models import UserFeedback


async def submit_feedback(
    db: AsyncSession,
    customer_id: str,
    rating: int,
    comments: str | None = None,
    plan_id: str | None = None,
) -> dict:
    fb = UserFeedback(
        customer_id=customer_id,
        plan_id=plan_id,
        rating=rating,
        comments=comments,
    )
    db.add(fb)
    await db.commit()
    return {
        "feedback_id": fb.feedback_id,
        "rating": fb.rating,
        "submitted_at": fb.submitted_at.isoformat(),
    }

"""
db/models.py
------------
SQLAlchemy 2.0 ORM models for Supabase / Postgres.
Matches the database schema in the blueprint exactly.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


# ── Customer ───────────────────────────────────────────────────────────────────

class Customer(Base):
    __tablename__ = "customer"

    customer_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid
    )
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    age: Mapped[int] = mapped_column(SmallInteger, nullable=True)
    email: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now
    )

    # relationships
    incomes: Mapped[list["Income"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    liabilities: Mapped[list["Liability"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    goals: Mapped[list["FinancialGoal"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    plans: Mapped[list["FinancialPlan"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    feedbacks: Mapped[list["UserFeedback"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


# ── Income ─────────────────────────────────────────────────────────────────────

class Income(Base):
    __tablename__ = "income"

    income_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    monthly_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    customer: Mapped["Customer"] = relationship(back_populates="incomes")

    __table_args__ = (
        CheckConstraint("monthly_amount >= 0", name="income_amount_positive"),
    )


# ── Expense ────────────────────────────────────────────────────────────────────

class Expense(Base):
    __tablename__ = "expense"

    expense_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    monthly_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    customer: Mapped["Customer"] = relationship(back_populates="expenses")

    __table_args__ = (
        CheckConstraint("monthly_amount >= 0", name="expense_amount_positive"),
    )


# ── Asset ──────────────────────────────────────────────────────────────────────

class Asset(Base):
    __tablename__ = "asset"

    asset_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    current_value: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    customer: Mapped["Customer"] = relationship(back_populates="assets")

    __table_args__ = (
        CheckConstraint("current_value >= 0", name="asset_value_positive"),
    )


# ── Liability ──────────────────────────────────────────────────────────────────

class Liability(Base):
    __tablename__ = "liability"

    liability_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)

    customer: Mapped["Customer"] = relationship(back_populates="liabilities")


# ── Risk Assessment ────────────────────────────────────────────────────────────

class RiskAssessment(Base):
    __tablename__ = "risk_assessment"

    assessment_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    answers: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    customer: Mapped["Customer"] = relationship(back_populates="risk_assessments")

    __table_args__ = (
        CheckConstraint("score BETWEEN 5 AND 25", name="risk_score_range"),
    )


# ── Financial Goal ─────────────────────────────────────────────────────────────

class FinancialGoal(Base):
    __tablename__ = "financial_goal"

    goal_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    goal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    target_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    today_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    priority: Mapped[int] = mapped_column(SmallInteger, default=3)
    inflation_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0.06)
    goal_name: Mapped[str] = mapped_column(String(60), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    customer: Mapped["Customer"] = relationship(back_populates="goals")
    plans: Mapped[list["FinancialPlan"]] = relationship(back_populates="goal", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("today_cost > 0", name="goal_cost_positive"),
    )


# ── Financial Plan ─────────────────────────────────────────────────────────────

class FinancialPlan(Base):
    __tablename__ = "financial_plan"

    plan_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    goal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("financial_goal.goal_id", ondelete="CASCADE"), nullable=True
    )
    plan_type: Mapped[str] = mapped_column(String(20), nullable=False)   # conservative/balanced/growth
    plan_name: Mapped[str] = mapped_column(String(60), nullable=True)
    expected_cagr: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    monthly_investment_required: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    goal_fv: Mapped[float] = mapped_column(Numeric(14, 2), nullable=True)
    projected_corpus: Mapped[float] = mapped_column(Numeric(14, 2), nullable=True)
    funded_pct: Mapped[float] = mapped_column(Numeric(6, 2), nullable=True)
    goal_success_probability: Mapped[float] = mapped_column(Numeric(6, 2), nullable=True)
    engine_version: Mapped[str] = mapped_column(String(10), default="1.0.0")
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    has_conflict: Mapped[bool] = mapped_column(Boolean, default=False)
    conflict_flags: Mapped[dict] = mapped_column(JSON_TYPE, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    customer: Mapped["Customer"] = relationship(back_populates="plans")
    goal: Mapped["FinancialGoal"] = relationship(back_populates="plans")
    allocations: Mapped[list["PlanAllocation"]] = relationship(back_populates="plan", cascade="all, delete-orphan")
    recommendations: Mapped[list["AiRecommendation"]] = relationship(back_populates="plan", cascade="all, delete-orphan")
    what_if_logs: Mapped[list["WhatIfLog"]] = relationship(back_populates="plan", cascade="all, delete-orphan")
    feedbacks: Mapped[list["UserFeedback"]] = relationship(back_populates="plan")


# ── Plan Allocation ────────────────────────────────────────────────────────────

class PlanAllocation(Base):
    __tablename__ = "plan_allocation"

    allocation_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("financial_plan.plan_id", ondelete="CASCADE"), nullable=False
    )
    asset_class: Mapped[str] = mapped_column(String(20), nullable=False)
    percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    plan: Mapped["FinancialPlan"] = relationship(back_populates="allocations")


# ── AI Recommendation ──────────────────────────────────────────────────────────

class AiRecommendation(Base):
    __tablename__ = "ai_recommendation"

    recommendation_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("financial_plan.plan_id", ondelete="CASCADE"), nullable=False
    )
    narrative_name: Mapped[str] = mapped_column(String(80), nullable=True)
    narrative_text: Mapped[str] = mapped_column(Text, nullable=False)
    risk_note: Mapped[str] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1.0")
    validation_status: Mapped[str] = mapped_column(String(20), default="passed")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    plan: Mapped["FinancialPlan"] = relationship(back_populates="recommendations")


# ── What-If Log ────────────────────────────────────────────────────────────────

class WhatIfLog(Base):
    __tablename__ = "what_if_log"

    log_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("financial_plan.plan_id", ondelete="CASCADE"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_intent: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    result_json: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    plan: Mapped["FinancialPlan"] = relationship(back_populates="what_if_logs")


# ── User Feedback ──────────────────────────────────────────────────────────────

class UserFeedback(Base):
    __tablename__ = "user_feedback"

    feedback_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("financial_plan.plan_id", ondelete="SET NULL"), nullable=True
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    customer: Mapped["Customer"] = relationship(back_populates="feedbacks")
    plan: Mapped["FinancialPlan"] = relationship(back_populates="feedbacks")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="feedback_rating_range"),
    )

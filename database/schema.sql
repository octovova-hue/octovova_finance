-- ====================================================================
-- Octovova Finance Planning Engine — PostgreSQL Database Schema
-- Architecture Blueprint & Reference Document Implementation
-- ====================================================================

-- 1. Enable Cryptographic UUID Generator Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain & Enum Types
DO $$ BEGIN
    CREATE TYPE plan_type_enum AS ENUM ('conservative', 'balanced', 'growth');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_category_enum AS ENUM ('Low', 'Moderate', 'High', 'Aggressive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_class_enum AS ENUM ('equity', 'debt', 'cash', 'real_estate', 'gold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE validation_status_enum AS ENUM ('pending', 'verified', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 3. Core Tables
-- ====================================================================

-- CUSTOMER: Login + Identity
CREATE TABLE IF NOT EXISTS customer (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    age INT CHECK (age >= 18 AND age <= 120),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INCOME: Monthly income sources
CREATE TABLE IF NOT EXISTS income (
    income_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL, -- 'salary', 'rental', 'business', 'other'
    monthly_amount NUMERIC(14, 2) NOT NULL CHECK (monthly_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXPENSE: Expense categories
CREATE TABLE IF NOT EXISTS expense (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'rent', 'food', 'transport', 'loans', 'lifestyle', 'utilities'
    monthly_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_amount >= 0),
    is_itemized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ASSET: Assets owned
CREATE TABLE IF NOT EXISTS asset (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'equity', 'cash_savings', 'real_estate', 'gold', 'fixed_deposits'
    current_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (current_value >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LIABILITY: Debts & Loans
CREATE TABLE IF NOT EXISTS liability (
    liability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'home_loan', 'personal_loan', 'car_loan', 'credit_card'
    outstanding_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (outstanding_amount >= 0),
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (interest_rate >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FINANCIAL_GOAL: Stated milestones
CREATE TABLE IF NOT EXISTS financial_goal (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    goal_type VARCHAR(100) NOT NULL, -- 'House', 'Wedding', 'Retirement', 'Education', 'Emergency', 'Custom'
    target_year INT NOT NULL CHECK (target_year >= EXTRACT(YEAR FROM NOW())),
    today_cost NUMERIC(14, 2) NOT NULL CHECK (today_cost > 0),
    priority INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    allocated_assets NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_assets >= 0),
    active_plan_type plan_type_enum NOT NULL DEFAULT 'balanced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RISK_ASSESSMENT: Point-in-time Risk Quiz result
CREATE TABLE IF NOT EXISTS risk_assessment (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- Stores questions, weights, selected option IDs
    score INT NOT NULL CHECK (score >= 0),
    category risk_category_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MARKET_DATA: Trend-data assumptions (Historical NIFTY / AMFI)
CREATE TABLE IF NOT EXISTS market_data (
    asset_class asset_class_enum PRIMARY KEY,
    avg_return NUMERIC(5, 4) NOT NULL, -- e.g. 0.1100 for 11%
    volatility NUMERIC(5, 4) NOT NULL, -- e.g. 0.1500 for 15%
    as_of_year INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FINANCIAL_PLAN: Generated 3-Plan architectures
CREATE TABLE IF NOT EXISTS financial_plan (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    goal_id UUID REFERENCES financial_goal(goal_id) ON DELETE SET NULL,
    plan_type plan_type_enum NOT NULL,
    name VARCHAR(150) NOT NULL,
    monthly_investment_required NUMERIC(14, 2) NOT NULL CHECK (monthly_investment_required >= 0),
    expected_cagr NUMERIC(5, 2) NOT NULL,
    target_goal_future_value NUMERIC(14, 2) NOT NULL,
    monte_carlo_probability NUMERIC(5, 2) NOT NULL DEFAULT 85.00, -- Computed once at plan-generation
    engine_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0-pure-math',
    is_selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAN_ALLOCATION: Asset class splits per plan
CREATE TABLE IF NOT EXISTS plan_allocation (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES financial_plan(plan_id) ON DELETE CASCADE,
    asset_class asset_class_enum NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    UNIQUE(plan_id, asset_class)
);

-- AI_RECOMMENDATION: GenAI's narrative output & audit metadata
CREATE TABLE IF NOT EXISTS ai_recommendation (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL UNIQUE REFERENCES financial_plan(plan_id) ON DELETE CASCADE,
    narrative_text TEXT NOT NULL,
    model_version VARCHAR(100) NOT NULL, -- e.g. 'gemini-1.5-flash' / 'gpt-4o' / 'deterministic-fallback'
    prompt_version VARCHAR(50) NOT NULL,  -- e.g. 'prompt-v2.1'
    validation_status validation_status_enum NOT NULL DEFAULT 'verified',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER_FEEDBACK: Rating & comments per plan
CREATE TABLE IF NOT EXISTS user_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES financial_plan(plan_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WHAT_IF_LOG: Audit trail for What-If scenario simulations
CREATE TABLE IF NOT EXISTS what_if_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    plan_id UUID REFERENCES financial_plan(plan_id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    parsed_intent JSONB NOT NULL, -- e.g. {"parameter": "sip", "delta": 15000}
    result_json JSONB NOT NULL,   -- e.g. {"new_sip": 147000, "surplus": 250000}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. Indexes for High-Performance Queries
-- ====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_income_customer_id ON income(customer_id);
CREATE INDEX IF NOT EXISTS idx_expense_customer_id ON expense(customer_id);
CREATE INDEX IF NOT EXISTS idx_asset_customer_id ON asset(customer_id);
CREATE INDEX IF NOT EXISTS idx_liability_customer_id ON liability(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_goal_customer_id ON financial_goal(customer_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessment_customer_id ON risk_assessment(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_plan_customer_id ON financial_plan(customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_allocation_plan_id ON plan_allocation(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_customer_id ON user_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_what_if_log_customer_id ON what_if_log(customer_id);

-- Composite Index for instantaneous "Get Active Plan" queries
CREATE INDEX IF NOT EXISTS idx_financial_plan_active ON financial_plan(customer_id, is_selected);

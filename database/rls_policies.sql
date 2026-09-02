-- ====================================================================
-- Octovova Finance — Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor to allow API read/write access
-- ====================================================================

-- 1. MARKET_DATA
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on market_data" ON market_data;
CREATE POLICY "Public access on market_data" ON market_data FOR ALL USING (true) WITH CHECK (true);

-- 2. CUSTOMER
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on customer" ON customer;
CREATE POLICY "Public access on customer" ON customer FOR ALL USING (true) WITH CHECK (true);

-- 3. INCOME
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on income" ON income;
CREATE POLICY "Public access on income" ON income FOR ALL USING (true) WITH CHECK (true);

-- 4. EXPENSE
ALTER TABLE expense ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on expense" ON expense;
CREATE POLICY "Public access on expense" ON expense FOR ALL USING (true) WITH CHECK (true);

-- 5. ASSET
ALTER TABLE asset ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on asset" ON asset;
CREATE POLICY "Public access on asset" ON asset FOR ALL USING (true) WITH CHECK (true);

-- 6. LIABILITY
ALTER TABLE liability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on liability" ON liability;
CREATE POLICY "Public access on liability" ON liability FOR ALL USING (true) WITH CHECK (true);

-- 7. FINANCIAL_GOAL
ALTER TABLE financial_goal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on financial_goal" ON financial_goal;
CREATE POLICY "Public access on financial_goal" ON financial_goal FOR ALL USING (true) WITH CHECK (true);

-- 8. RISK_ASSESSMENT
ALTER TABLE risk_assessment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on risk_assessment" ON risk_assessment;
CREATE POLICY "Public access on risk_assessment" ON risk_assessment FOR ALL USING (true) WITH CHECK (true);

-- 9. FINANCIAL_PLAN
ALTER TABLE financial_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on financial_plan" ON financial_plan;
CREATE POLICY "Public access on financial_plan" ON financial_plan FOR ALL USING (true) WITH CHECK (true);

-- 10. PLAN_ALLOCATION
ALTER TABLE plan_allocation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on plan_allocation" ON plan_allocation;
CREATE POLICY "Public access on plan_allocation" ON plan_allocation FOR ALL USING (true) WITH CHECK (true);

-- 11. AI_RECOMMENDATION
ALTER TABLE ai_recommendation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on ai_recommendation" ON ai_recommendation;
CREATE POLICY "Public access on ai_recommendation" ON ai_recommendation FOR ALL USING (true) WITH CHECK (true);

-- 12. USER_FEEDBACK
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on user_feedback" ON user_feedback;
CREATE POLICY "Public access on user_feedback" ON user_feedback FOR ALL USING (true) WITH CHECK (true);

-- 13. WHAT_IF_LOG
ALTER TABLE what_if_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on what_if_log" ON what_if_log;
CREATE POLICY "Public access on what_if_log" ON what_if_log FOR ALL USING (true) WITH CHECK (true);

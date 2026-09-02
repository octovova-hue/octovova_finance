-- ====================================================================
-- Octovova Finance — Truncate / Delete All Data from All Tables
-- WARNING: This will permanently wipe all customer profiles, goals,
-- plans, market data, and logs across all 13 tables.
-- ====================================================================

BEGIN;

TRUNCATE TABLE 
    what_if_log,
    user_feedback,
    ai_recommendation,
    plan_allocation,
    financial_plan,
    risk_assessment,
    financial_goal,
    liability,
    asset,
    expense,
    income,
    customer,
    market_data
CASCADE;

COMMIT;

-- Verification Query: All table counts should be 0
SELECT 'customer' AS table_name, count(*) AS remaining_rows FROM customer
UNION ALL SELECT 'income', count(*) FROM income
UNION ALL SELECT 'expense', count(*) FROM expense
UNION ALL SELECT 'asset', count(*) FROM asset
UNION ALL SELECT 'liability', count(*) FROM liability
UNION ALL SELECT 'financial_goal', count(*) FROM financial_goal
UNION ALL SELECT 'risk_assessment', count(*) FROM risk_assessment
UNION ALL SELECT 'financial_plan', count(*) FROM financial_plan
UNION ALL SELECT 'plan_allocation', count(*) FROM plan_allocation
UNION ALL SELECT 'ai_recommendation', count(*) FROM ai_recommendation
UNION ALL SELECT 'user_feedback', count(*) FROM user_feedback
UNION ALL SELECT 'what_if_log', count(*) FROM what_if_log
UNION ALL SELECT 'market_data', count(*) FROM market_data;

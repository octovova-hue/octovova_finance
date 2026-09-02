-- ====================================================================
-- Octovova Finance Planning Engine — Seed Data
-- ====================================================================

-- 1. Insert Market Data (NIFTY & AMFI Benchmark Returns & Volatilities)
INSERT INTO market_data (asset_class, avg_return, volatility, as_of_year) VALUES
    ('equity', 0.1100, 0.1500, 2026),
    ('debt',   0.0650, 0.0400, 2026),
    ('cash',   0.0400, 0.0100, 2026),
    ('real_estate', 0.0850, 0.0800, 2026),
    ('gold',   0.0900, 0.1200, 2026)
ON CONFLICT (asset_class) DO UPDATE 
SET avg_return = EXCLUDED.avg_return, 
    volatility = EXCLUDED.volatility, 
    as_of_year = EXCLUDED.as_of_year,
    updated_at = NOW();

-- 2. Seed Demo Customer: Priya Sharma (UUID: c0000000-0000-0000-0000-000000000001)
INSERT INTO customer (customer_id, name, age, email, password_hash)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Priya Sharma',
    35,
    'priya.sharma@octovova.com',
    'sha256_mock_hash_for_demo_auth'
) ON CONFLICT (email) DO NOTHING;

-- 3. Incomes for Priya Sharma
INSERT INTO income (customer_id, source, monthly_amount) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Salary', 150000.00);

-- 4. Expenses for Priya Sharma
INSERT INTO expense (customer_id, category, monthly_amount, is_itemized) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Housing', 30000.00, true),
    ('c0000000-0000-0000-0000-000000000001', 'Food', 20000.00, true),
    ('c0000000-0000-0000-0000-000000000001', 'Transport', 10000.00, true),
    ('c0000000-0000-0000-0000-000000000001', 'EMI', 12000.00, true),
    ('c0000000-0000-0000-0000-000000000001', 'Lifestyle', 8000.00, true);

-- 5. Assets for Priya Sharma
INSERT INTO asset (customer_id, type, current_value) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Mutual Funds', 700000.00),
    ('c0000000-0000-0000-0000-000000000001', 'Fixed Deposit', 300000.00),
    ('c0000000-0000-0000-0000-000000000001', 'Cash & Savings', 200000.00);

-- 6. Liabilities for Priya Sharma
INSERT INTO liability (customer_id, type, outstanding_amount, interest_rate) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Personal Loan', 500000.00, 11.50);

-- 7. Goals for Priya Sharma (Valid hex UUID: b0000000-...)
INSERT INTO financial_goal (goal_id, customer_id, name, goal_type, target_year, today_cost, priority, allocated_assets, active_plan_type) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Dream House', 'House', 2031, 8000000.00, 5, 200000.00, 'balanced'),
    ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Retirement Fund', 'Retirement', 2046, 20000000.00, 4, 500000.00, 'growth')
ON CONFLICT (goal_id) DO NOTHING;

-- 8. Risk Assessment for Priya Sharma
INSERT INTO risk_assessment (customer_id, answers, score, category) VALUES
    ('c0000000-0000-0000-0000-000000000001', '{"timeline": 4, "income_stability": 3}'::jsonb, 17, 'Moderate');

-- 9. Financial Plans for Priya Sharma (Valid hex UUID: e0000000-...)
INSERT INTO financial_plan (plan_id, customer_id, goal_id, plan_type, name, monthly_investment_required, expected_cagr, target_goal_future_value, monte_carlo_probability, engine_version, is_selected) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'conservative', 'Capital Preservation', 152000.00, 7.80, 10705800.00, 94.50, 'v1.0.0-pure-math', false),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'balanced', 'Balanced Growth', 132000.00, 9.40, 10705800.00, 86.00, 'v1.0.0-pure-math', true),
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'growth', 'High Equity Accelerator', 118000.00, 11.00, 10705800.00, 78.00, 'v1.0.0-pure-math', false)
ON CONFLICT (plan_id) DO NOTHING;

-- 10. Plan Allocations
INSERT INTO plan_allocation (plan_id, asset_class, percentage) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'equity', 25.00),
    ('e0000000-0000-0000-0000-000000000001', 'debt', 60.00),
    ('e0000000-0000-0000-0000-000000000001', 'cash', 15.00),
    ('e0000000-0000-0000-0000-000000000002', 'equity', 55.00),
    ('e0000000-0000-0000-0000-000000000002', 'debt', 40.00),
    ('e0000000-0000-0000-0000-000000000002', 'cash', 5.00),
    ('e0000000-0000-0000-0000-000000000003', 'equity', 80.00),
    ('e0000000-0000-0000-0000-000000000003', 'debt', 15.00),
    ('e0000000-0000-0000-0000-000000000003', 'cash', 5.00)
ON CONFLICT (plan_id, asset_class) DO NOTHING;

-- 11. AI Recommendations
INSERT INTO ai_recommendation (plan_id, narrative_text, model_version, prompt_version, validation_status) VALUES
    ('e0000000-0000-0000-0000-000000000002', 'The Balanced Growth strategy allocates 55% to Equity index funds and 40% to high-grade Debt instruments. This maximizes compounded wealth accumulation while buffering the Dream House target against near-term drawdowns.', 'gemini-1.5-flash', 'prompt-v2.0', 'verified')
ON CONFLICT (plan_id) DO NOTHING;

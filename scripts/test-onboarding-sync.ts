import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtjmkqygotkalkemieou.supabase.co';
const supabaseKey = 'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

async function testSync() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing full onboarding data sync...');

  // 1. Create or get customer
  const { data: customer, error: custErr } = await supabase
    .from('customer')
    .upsert({
      name: 'Test Onboarding User',
      email: 'test.onboarding@octovova.com',
      password_hash: 'sha256_mock_test_hash',
      age: 28,
    }, { onConflict: 'email' })
    .select()
    .single();

  if (custErr) {
    console.error('❌ Customer Error:', custErr);
    return;
  }
  const customerId = customer.customer_id;
  console.log('✅ Customer ID:', customerId);

  // 2. Incomes
  const { error: incErr } = await supabase.from('income').insert([
    { customer_id: customerId, source: 'Salary', monthly_amount: 120000 },
    { customer_id: customerId, source: 'Bonus', monthly_amount: 15000 }
  ]);
  if (incErr) console.error('❌ Income Error:', incErr);
  else console.log('✅ Incomes saved');

  // 3. Expenses
  const { error: expErr } = await supabase.from('expense').insert([
    { customer_id: customerId, category: 'Housing', monthly_amount: 35000, is_itemized: true },
    { customer_id: customerId, category: 'Food', monthly_amount: 15000, is_itemized: true },
    { customer_id: customerId, category: 'Transport', monthly_amount: 8000, is_itemized: true }
  ]);
  if (expErr) console.error('❌ Expense Error:', expErr);
  else console.log('✅ Expenses saved');

  // 4. Assets
  const { error: astErr } = await supabase.from('asset').insert([
    { customer_id: customerId, type: 'Mutual Funds', current_value: 500000 },
    { customer_id: customerId, type: 'Fixed Deposit', current_value: 200000 }
  ]);
  if (astErr) console.error('❌ Asset Error:', astErr);
  else console.log('✅ Assets saved');

  // 5. Liabilities
  const { error: liaErr } = await supabase.from('liability').insert([
    { customer_id: customerId, type: 'Car Loan', outstanding_amount: 300000, interest_rate: 9.5 }
  ]);
  if (liaErr) console.error('❌ Liability Error:', liaErr);
  else console.log('✅ Liabilities saved');

  // 6. Goals
  const { data: goals, error: goalErr } = await supabase.from('financial_goal').insert([
    {
      customer_id: customerId,
      name: 'Dream Home',
      goal_type: 'House',
      target_year: 2032,
      today_cost: 9000000,
      priority: 5,
      allocated_assets: 300000,
      active_plan_type: 'balanced'
    },
    {
      customer_id: customerId,
      name: 'Early Retirement',
      goal_type: 'Retirement',
      target_year: 2045,
      today_cost: 25000000,
      priority: 4,
      allocated_assets: 200000,
      active_plan_type: 'growth'
    }
  ]).select();

  if (goalErr) console.error('❌ Goal Error:', goalErr);
  else console.log('✅ Goals saved:', goals?.length);

  // 7. Risk Assessment
  // Map 'Balanced'/'Conservative'/'Growth' to enum 'Low'|'Moderate'|'High'|'Aggressive'
  const { error: riskErr } = await supabase.from('risk_assessment').insert({
    customer_id: customerId,
    answers: { timeline: 4, income_stability: 3, risk_appetite: 3 },
    score: 16,
    category: 'Moderate'
  });
  if (riskErr) console.error('❌ Risk Assessment Error:', riskErr);
  else console.log('✅ Risk Assessment saved');

  // 8. Financial Plans & Allocations & AI Recommendations
  const { data: insertedPlan, error: planErr } = await supabase.from('financial_plan').insert({
    customer_id: customerId,
    plan_type: 'balanced',
    name: 'Balanced Growth',
    monthly_investment_required: 115000,
    expected_cagr: 9.4,
    target_goal_future_value: 12000000,
    monte_carlo_probability: 86.0,
    engine_version: 'v1.0.0-pure-math',
    is_selected: true
  }).select().single();

  if (planErr) console.error('❌ Plan Error:', planErr);
  else {
    console.log('✅ Plan saved:', insertedPlan.plan_id);

    // Plan allocations
    const { error: allocErr } = await supabase.from('plan_allocation').insert([
      { plan_id: insertedPlan.plan_id, asset_class: 'equity', percentage: 55 },
      { plan_id: insertedPlan.plan_id, asset_class: 'debt', percentage: 40 },
      { plan_id: insertedPlan.plan_id, asset_class: 'cash', percentage: 5 }
    ]);
    if (allocErr) console.error('❌ Plan Allocation Error:', allocErr);
    else console.log('✅ Plan Allocations saved');

    // AI Recommendation
    const { error: aiErr } = await supabase.from('ai_recommendation').insert({
      plan_id: insertedPlan.plan_id,
      narrative_text: 'Allocating 55% equity and 40% debt maximizes compounding while providing capital security.',
      model_version: 'gemini-1.5-flash',
      prompt_version: 'prompt-v2.0',
      validation_status: 'verified'
    });
    if (aiErr) console.error('❌ AI Recommendation Error:', aiErr);
    else console.log('✅ AI Recommendation saved');
  }
}

testSync();

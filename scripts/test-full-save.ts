import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtjmkqygotkalkemieou.supabase.co';
const supabaseKey = 'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

async function testFullSave() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing creating customer & saving full profile...');

  const customerId = 'c0000000-0000-0000-0000-000000000001'; // Valid UUID

  // 1. Create or upsert customer
  const { data: cust, error: custErr } = await supabase
    .from('customer')
    .upsert({
      customer_id: customerId,
      name: 'Priya Sharma',
      age: 35,
      email: 'priya.sharma@octovova.com',
      password_hash: 'password123',
    }, { onConflict: 'email' })
    .select()
    .single();

  if (custErr) {
    console.error('❌ Customer upsert error:', custErr);
  } else {
    console.log('✅ Customer upserted successfully:', cust);
  }

  // 2. Insert Incomes
  const { error: incErr } = await supabase.from('income').insert([
    { customer_id: customerId, source: 'Salary', monthly_amount: 150000 }
  ]);
  if (incErr) console.error('❌ Income insert error:', incErr);
  else console.log('✅ Incomes inserted');

  // 3. Insert Expenses
  const { error: expErr } = await supabase.from('expense').insert([
    { customer_id: customerId, category: 'Housing', monthly_amount: 30000, is_itemized: true },
    { customer_id: customerId, category: 'Food', monthly_amount: 20000, is_itemized: true }
  ]);
  if (expErr) console.error('❌ Expense insert error:', expErr);
  else console.log('✅ Expenses inserted');

  // 4. Insert Goals
  const { error: goalErr } = await supabase.from('financial_goal').insert([
    {
      customer_id: customerId,
      name: 'Dream House',
      goal_type: 'House',
      target_year: 2031,
      today_cost: 8000000,
      priority: 5,
      allocated_assets: 200000,
      active_plan_type: 'balanced'
    }
  ]);
  if (goalErr) console.error('❌ Goal insert error:', goalErr);
  else console.log('✅ Goals inserted');
}

testFullSave();

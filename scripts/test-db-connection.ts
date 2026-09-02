import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtjmkqygotkalkemieou.supabase.co';
const supabaseKey = 'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

async function testDatabase() {
  console.log('Testing live connection to Supabase PostgreSQL at:', supabaseUrl);
  const startTime = Date.now();
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Query market_data table
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*');

    if (marketError) {
      console.error('❌ Error querying market_data:', marketError.message);
    } else {
      console.log('✅ Connected to market_data table! Rows retrieved:', marketData?.length);
      console.log('   Data:', JSON.stringify(marketData, null, 2));
    }

    // 2. Query customer table
    const { data: customers, error: customerError } = await supabase
      .from('customer')
      .select('customer_id, name, email, age');

    if (customerError) {
      console.error('❌ Error querying customer:', customerError.message);
    } else {
      console.log('✅ Connected to customer table! Rows retrieved:', customers?.length);
      console.log('   Customers:', JSON.stringify(customers, null, 2));
    }

    // 3. Query financial_goal table
    const { data: goals, error: goalError } = await supabase
      .from('financial_goal')
      .select('goal_id, name, goal_type, target_year, today_cost');

    if (goalError) {
      console.error('❌ Error querying financial_goal:', goalError.message);
    } else {
      console.log('✅ Connected to financial_goal table! Rows retrieved:', goals?.length);
      console.log('   Goals:', JSON.stringify(goals, null, 2));
    }

    const elapsed = Date.now() - startTime;
    console.log(`\n🎉 Test Complete! Overall Latency: ${elapsed}ms`);
  } catch (err: any) {
    console.error('❌ Exception during connection test:', err?.message || err);
  }
}

testDatabase();

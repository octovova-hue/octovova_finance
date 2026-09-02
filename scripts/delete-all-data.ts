import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dtjmkqygotkalkemieou.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

const tablesToDeleteInOrder = [
  'what_if_log',
  'user_feedback',
  'ai_recommendation',
  'plan_allocation',
  'financial_plan',
  'risk_assessment',
  'financial_goal',
  'liability',
  'asset',
  'expense',
  'income',
  'customer',
  'market_data',
];

async function deleteAllData() {
  console.log('🗑️  Initiating full database wipe across all tables at:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const table of tablesToDeleteInOrder) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('created_at', '1970-01-01T00:00:00.000Z'); // Matches all rows

      if (error) {
        console.warn(`⚠️ Warning deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared table: ${table}`);
      }
    } catch (err: any) {
      console.error(`❌ Error on ${table}:`, err?.message || err);
    }
  }

  console.log('\n🎉 Complete! All database tables have been emptied.');
}

deleteAllData();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtjmkqygotkalkemieou.supabase.co';
const supabaseKey = 'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

async function testInsertAndFetch() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing INSERT & SELECT via Supabase Client...');

  // Test insert market_data
  const { data, error } = await supabase.from('market_data').upsert([
    { asset_class: 'equity', avg_return: 0.11, volatility: 0.15, as_of_year: 2026 },
    { asset_class: 'debt', avg_return: 0.065, volatility: 0.04, as_of_year: 2026 },
    { asset_class: 'cash', avg_return: 0.04, volatility: 0.01, as_of_year: 2026 },
  ]).select();

  if (error) {
    console.error('❌ Insert Error:', error.message, error.details, error.hint);
  } else {
    console.log('✅ Inserted / Upserted Rows:', data);
  }

  // Fetch back
  const { data: fetched, error: fetchErr } = await supabase.from('market_data').select('*');
  console.log('✅ Fetched market_data:', fetched);
}

testInsertAndFetch();

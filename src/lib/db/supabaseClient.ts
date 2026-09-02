import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for PostgreSQL / Supabase
const supabaseUrl =
  localStorage.getItem('octovova_custom_supabase_url') ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://dtjmkqygotkalkemieou.supabase.co';

const supabaseAnonKey =
  localStorage.getItem('octovova_custom_supabase_key') ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l';

export const isPostgresConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const supabase: SupabaseClient | null = isPostgresConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

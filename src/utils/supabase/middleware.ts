import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dtjmkqygotkalkemieou.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ql8ArJtwA_7RviGI72dInQ_rtLm066l";

export const createClient = (request: any, responseObj: any) => {
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request?.cookies?.getAll?.() || [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request?.cookies?.set?.(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            responseObj?.cookies?.set?.(name, value, options)
          );
        },
      },
    }
  );

  return supabase;
};

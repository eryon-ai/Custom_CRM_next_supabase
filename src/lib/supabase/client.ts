import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './config';
import type { Database } from '@/types/database';

export function createClient() {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    throw new Error('Supabase is not configured. Add valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  return createBrowserClient<Database>(url, key);
}

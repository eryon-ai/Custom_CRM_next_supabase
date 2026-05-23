import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './config';
import type { Database } from '@/types/database';

export async function createClient() {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    throw new Error('Supabase is not configured');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from server component - ignore
        }
      },
    },
  });
}

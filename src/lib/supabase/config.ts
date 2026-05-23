function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface SupabaseEnv {
  url: string;
  key: string;
  isConfigured: boolean;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  const isConfigured = isValidHttpUrl(url) && typeof key === 'string' && key.length > 20;

  return { url, key, isConfigured };
}

export const SUPABASE_CLIENT_OPTIONS = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'marble-mart-crm' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

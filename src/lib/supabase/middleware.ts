import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseEnv } from './config';

export async function updateSession(request: NextRequest) {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith('/dashboard')) {
    const urlObj = request.nextUrl.clone();
    urlObj.pathname = '/login';
    return NextResponse.redirect(urlObj);
  }

  if (user && (path === '/login' || path === '/signup')) {
    const urlObj = request.nextUrl.clone();
    urlObj.pathname = '/dashboard';
    return NextResponse.redirect(urlObj);
  }

  // RBAC check for admin routes
  if (path.startsWith('/dashboard/settings') && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
      const urlObj = request.nextUrl.clone();
      urlObj.pathname = '/dashboard';
      return NextResponse.redirect(urlObj);
    }
  }

  return supabaseResponse;
}

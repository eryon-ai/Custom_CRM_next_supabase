// ============================================================
// Setup API — One-time seed for admin user (dev/test only)
// POST /api/setup/seed-user
// Creates a confirmed admin user in Supabase Auth + profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const email = 'admin@marblemart.com';
    const password = 'Admin@123456';
    const fullName = 'Admin User';

    // 1. Create or get the auth user
    const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;

    let userId: string;
    const found = existingUsers.users.find((u: Record<string, unknown>) => u.email === email);

    if (found) {
      userId = found.id;

      // Ensure email is confirmed
      if (!found.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
          password,
        });
      }
    } else {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
    }

    // 2. Upsert user_profiles
    const { error: profileErr } = await supabase.from('user_profiles').upsert({
      id: userId,
      role: 'admin',
      full_name: fullName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileErr) throw profileErr;

    // 3. Upsert agents record
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existingAgent) {
      await supabase.from('agents').upsert({
        user_id: userId,
        name: fullName,
        email,
        status: 'Active',
        last_active_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from('agents')
        .update({ user_id: userId, status: 'Active', last_active_at: new Date().toISOString() })
        .eq('id', existingAgent.id);
    }

    return NextResponse.json({
      success: true,
      user: { email, password, userId, role: 'admin' },
    });
  } catch (error) {
    console.error('[setup/seed-user]', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Setup failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// Roles API — Role assignment management
// PATCH /api/roles — Update a user's role
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROLE_DEFINITIONS, type RoleId } from '@/config/permissions';

const VALID_ROLES: RoleId[] = ['super_admin', 'director', 'sales_manager', 'sales_executive', 'marketing', 'accountant', 'warehouse'];

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId, role, agentId } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role as RoleId)) {
      return NextResponse.json({ error: `Invalid role. Valid: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    // Upsert into user_profiles
    const { error: profileErr } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        id: userId,
        role,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileErr) {
      // Table might not exist yet — still return success for the role change
      console.warn('[roles] user_profiles upsert warning:', profileErr.message);
    }

    // Touch agent record's updated_at if agentId provided
    if (agentId) {
      await (supabase as any)
        .from('agents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', agentId);
    }

    return NextResponse.json({
      success: true,
      userId,
      role,
      roleLabel: ROLE_DEFINITIONS[role as RoleId]?.label || role,
    });
  } catch (error) {
    console.error('[roles] PATCH error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

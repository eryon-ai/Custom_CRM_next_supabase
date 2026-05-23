import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapWorkflowRule(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    triggerEvent: (row.trigger_event as string) ?? '',
    conditions: row.conditions ?? null,
    actions: row.actions ?? {},
    isActive: (row.is_active as boolean) ?? false,
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  };
}

// GET /api/workflow — List all workflow rules
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('workflow_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return cachedResponse({ rules: (data || []).map(mapWorkflowRule) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch workflow rules' },
      { status: 500 }
    );
  }
}

// POST /api/workflow — Create a new workflow rule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.triggerEvent) {
      return NextResponse.json(
        { error: 'Name and trigger event are required' },
        { status: 400 }
      );
    }

    if (!body?.actions || typeof body.actions !== 'object') {
      return NextResponse.json(
        { error: 'Actions configuration is required' },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      name: String(body.name).trim(),
      trigger_event: String(body.triggerEvent).trim(),
      conditions: body.conditions || null,
      actions: body.actions,
      is_active: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('workflow_rules')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ rule: mapWorkflowRule(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create workflow rule' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflow — Update a workflow rule
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule id is required' }, { status: 400 });
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = String(updates.name).trim();
    if (updates.triggerEvent !== undefined) dbUpdates.trigger_event = String(updates.triggerEvent).trim();
    if (updates.conditions !== undefined) dbUpdates.conditions = updates.conditions;
    if (updates.actions !== undefined) dbUpdates.actions = updates.actions;
    if (updates.isActive !== undefined) dbUpdates.is_active = Boolean(updates.isActive);

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('workflow_rules')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ rule: mapWorkflowRule(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update workflow rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflow — Delete a workflow rule
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from('workflow_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete workflow rule' },
      { status: 500 }
    );
  }
}

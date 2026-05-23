import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();

    // P0 FIX: Use single aggregated query instead of fetching all leads + client-side count
    const { data: agents, error: agentsError } = await (supabase as any)
      .from('agents')
      .select('*, leads!leads_assigned_to_fkey(count)')
      .order('created_at', { ascending: false });

    if (agentsError) {
      // Fallback: original two-query approach if join fails
      const [{ data: agentsFb, error: aErr }, { data: leadCounts, error: cErr }] =
        await Promise.all([
          (supabase as any).from('agents').select('*').order('created_at', { ascending: false }),
          (supabase as any).from('leads').select('assigned_to'),
        ]);
      if (aErr) throw aErr;
      if (cErr) throw cErr;
      const byAgent: Record<string, number> = (leadCounts || []).reduce(
        (acc: Record<string, number>, row: any) => {
          if (!row.assigned_to) return acc;
          acc[row.assigned_to] = (acc[row.assigned_to] || 0) + 1;
          return acc;
        }, {});
      const mapped = (agentsFb || []).map((a: any) => ({
        id: a.id, name: a.name, email: a.email || '', phone: a.phone || '',
        status: a.status || 'Offline',
        lastActive: a.last_active_at ? new Date(a.last_active_at).toLocaleString() : 'No activity',
        totalLeads: byAgent[a.id] || 0,
      }));
      return cachedResponse({ agents: mapped });
    }

    const mapped = (agents || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      email: a.email || '',
      phone: a.phone || '',
      status: a.status || 'Offline',
      lastActive: a.last_active_at
        ? new Date(a.last_active_at).toLocaleString()
        : 'No activity',
      totalLeads: a.leads?.[0]?.count || 0,
    }));

    return cachedResponse({ agents: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      name: String(body.name).trim(),
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      status: body.status ? String(body.status).trim() : 'Offline',
      last_active_at: new Date().toISOString(),
    };

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('agents')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned');

    const agentData = data as unknown as Record<string, unknown>;
    const mapped = {
      id: agentData.id as string,
      name: agentData.name as string,
      email: (agentData.email as string) || '',
      phone: (agentData.phone as string) || '',
      status: (agentData.status as string) || 'Offline',
      lastActive: agentData.last_active_at
        ? new Date(agentData.last_active_at as string).toLocaleString()
        : 'No activity',
      totalLeads: 0,
    };

    return NextResponse.json({ agent: mapped }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}

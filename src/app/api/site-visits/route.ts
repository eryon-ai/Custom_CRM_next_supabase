import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

// GET /api/site-visits — List site visits
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = (supabase as any)
      .from('site_visits')
      .select('*, leads(id, name, phone), agents(id, name)')
      .order('scheduled_at', { ascending: true });

    if (leadId) query = query.eq('lead_id', leadId);
    if (agentId) query = query.eq('agent_id', agentId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const visits = (data || []).map((row: any) => ({
      id: row.id,
      leadId: row.lead_id,
      leadName: row.leads?.name || '',
      leadPhone: row.leads?.phone || '',
      agentId: row.agent_id,
      agentName: row.agents?.name || '',
      scheduledAt: row.scheduled_at,
      actualAt: row.actual_at,
      status: row.status,
      outcome: row.outcome,
      notes: row.notes,
      photos: row.photos || [],
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      createdAt: row.created_at,
    }));

    return cachedResponse({ visits });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch site visits' },
      { status: 500 }
    );
  }
}

// POST /api/site-visits — Schedule a new site visit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.leadId || !body?.scheduledAt) {
      return NextResponse.json({ error: 'Lead ID and scheduled time are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    let agentId = body.agentId;

    // If agent not specified, try to get from user profile
    if (!agentId && user) {
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('agent_id')
        .eq('id', user.id)
        .single();
      agentId = profile?.agent_id;
    }

    const payload: Record<string, unknown> = {
      lead_id: String(body.leadId).trim(),
      agent_id: agentId || null,
      scheduled_at: String(body.scheduledAt).trim(),
      address: body.address ? String(body.address).trim() : null,
      latitude: body.latitude ? Number(body.latitude) : null,
      longitude: body.longitude ? Number(body.longitude) : null,
      notes: body.notes ? String(body.notes).trim() : null,
      status: 'Scheduled',
    };

    const { data, error } = await (supabase as any)
      .from('site_visits')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    // Log activity on the lead
    await (supabase as any).from('lead_activities').insert({
      lead_id: body.leadId,
      activity_type: 'site_visit_scheduled',
      description: `Site visit scheduled for ${new Date(body.scheduledAt).toLocaleString('en-IN')}`,
    });

    return NextResponse.json({ visit: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to schedule visit' },
      { status: 500 }
    );
  }
}

// PATCH /api/site-visits — Update site visit (check-in, complete, add photos)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const dbUpdates: Record<string, unknown> = {};

    if (action === 'checkin') {
      dbUpdates.status = 'In Progress';
      dbUpdates.actual_at = new Date().toISOString();
      if (updates.latitude) dbUpdates.latitude = Number(updates.latitude);
      if (updates.longitude) dbUpdates.longitude = Number(updates.longitude);
    } else if (action === 'complete') {
      dbUpdates.status = 'Completed';
      if (updates.outcome) dbUpdates.outcome = String(updates.outcome).trim();
      if (updates.notes) dbUpdates.notes = String(updates.notes).trim();
      if (updates.photos) dbUpdates.photos = updates.photos;
    } else if (action === 'cancel') {
      dbUpdates.status = 'Cancelled';
      if (updates.notes) dbUpdates.notes = String(updates.notes).trim();
    } else {
      if (updates.status !== undefined) dbUpdates.status = String(updates.status).trim();
      if (updates.outcome !== undefined) dbUpdates.outcome = String(updates.outcome).trim();
      if (updates.notes !== undefined) dbUpdates.notes = String(updates.notes).trim();
      if (updates.address !== undefined) dbUpdates.address = String(updates.address).trim();
      if (updates.photos !== undefined) dbUpdates.photos = updates.photos;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('site_visits')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ visit: data });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update visit' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function mapLead(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    phone: (row.phone as string) ?? '',
    email: (row.email as string) ?? '',
    company: (row.company as string) ?? '',
    contactPerson: (row.contact_person as string) ?? '',
    marbleType: (row.marble_type as string) ?? '',
    quantity: (row.quantity as string) ?? '',
    siteLocation: (row.site_location as string) ?? '',
    city: (row.city as string) ?? '',
    state: (row.state as string) ?? '',
    pincode: (row.pincode as string) ?? '',
    status: (row.status as string) ?? 'New',
    pipelineStage: (row.pipeline_stage as string) ?? 'New',
    dealValue: (row.deal_value as number) ?? 0,
    probability: (row.probability as number) ?? 0,
    leadScore: (row.lead_score as number) ?? 0,
    leadSource: (row.lead_source as string) ?? '',
    assignedTo: (row.assigned_to as string) ?? '',
    createdBy: (row.created_by as string) ?? '',
    notes: (row.notes as string) ?? '',
    followUpAt: (row.follow_up_at as string) ?? null,
    lastContactedAt: (row.last_contacted_at as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

// GET /api/leads/[id] — Get a single lead by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ lead: mapLead(data) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] — Update any lead field
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const body = await request.json();
    const dbUpdates: Record<string, unknown> = {};

    // Map camelCase frontend fields to snake_case DB columns
    if (body.name !== undefined) dbUpdates.name = String(body.name).trim();
    if (body.phone !== undefined) dbUpdates.phone = String(body.phone).trim();
    if (body.email !== undefined) dbUpdates.email = body.email ? String(body.email).trim() : null;
    if (body.company !== undefined) dbUpdates.company = body.company ? String(body.company).trim() : null;
    if (body.contactPerson !== undefined) dbUpdates.contact_person = body.contactPerson ? String(body.contactPerson).trim() : null;
    if (body.marbleType !== undefined) dbUpdates.marble_type = body.marbleType ? String(body.marbleType).trim() : null;
    if (body.quantity !== undefined) dbUpdates.quantity = body.quantity ? String(body.quantity).trim() : null;
    if (body.siteLocation !== undefined) dbUpdates.site_location = body.siteLocation ? String(body.siteLocation).trim() : null;
    if (body.city !== undefined) dbUpdates.city = body.city ? String(body.city).trim() : null;
    if (body.state !== undefined) dbUpdates.state = body.state ? String(body.state).trim() : null;
    if (body.pincode !== undefined) dbUpdates.pincode = body.pincode ? String(body.pincode).trim() : null;
    if (body.status !== undefined) dbUpdates.status = String(body.status).trim();
    if (body.pipelineStage !== undefined) dbUpdates.pipeline_stage = String(body.pipelineStage).trim();
    if (body.dealValue !== undefined) dbUpdates.deal_value = body.dealValue ? Number(body.dealValue) : null;
    if (body.probability !== undefined) dbUpdates.probability = Number(body.probability);
    if (body.leadScore !== undefined) dbUpdates.lead_score = Number(body.leadScore);
    if (body.leadSource !== undefined) dbUpdates.lead_source = body.leadSource ? String(body.leadSource).trim() : null;
    if (body.assignedTo !== undefined) dbUpdates.assigned_to = body.assignedTo ? String(body.assignedTo).trim() : null;
    if (body.notes !== undefined) dbUpdates.notes = body.notes ? String(body.notes).trim() : null;
    if (body.followUpAt !== undefined) dbUpdates.follow_up_at = body.followUpAt ? String(body.followUpAt).trim() : null;
    if (body.lastContactedAt !== undefined) dbUpdates.last_contacted_at = body.lastContactedAt ? String(body.lastContactedAt).trim() : null;

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = await createClient();
    let updateQuery = (supabase as any).from('leads').update(dbUpdates).eq('id', id);

    // P1 FIX: Optimistic locking — only update if not modified since client read
    if (body._updatedAt) {
      updateQuery = updateQuery.eq('updated_at', body._updatedAt);
    }

    const { data, error } = await updateQuery.select('*').single();

    if (error) throw error;

    // Log the update activity
    await (supabase as any)
      .from('lead_activities')
      .insert({
        lead_id: id,
        activity_type: 'lead_updated',
        description: `Lead details updated`,
        metadata: { updated_fields: Object.keys(dbUpdates) },
      });

    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ lead: mapLead(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] — Delete a lead
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

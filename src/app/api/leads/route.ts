import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('id, name, phone, email, company, contact_person, marble_type, quantity, site_location, city, state, pincode, status, pipeline_stage, deal_value, probability, lead_score, lead_source, assigned_to, created_by, notes, follow_up_at, last_contacted_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return cachedResponse({ leads: (data || []).map(mapLead) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim() : null,
      company: body.company ? String(body.company).trim() : null,
      contact_person: body.contactPerson ? String(body.contactPerson).trim() : null,
      marble_type: body.marbleType ? String(body.marbleType).trim() : null,
      quantity: body.quantity ? String(body.quantity).trim() : null,
      site_location: body.siteLocation ? String(body.siteLocation).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      pincode: body.pincode ? String(body.pincode).trim() : null,
      status: body.status ? String(body.status).trim() : 'New',
      pipeline_stage: body.pipelineStage ? String(body.pipelineStage).trim() : 'New',
      deal_value: body.dealValue ? Number(body.dealValue) : null,
      probability: body.probability ? Number(body.probability) : 0,
      lead_score: body.leadScore ? Number(body.leadScore) : 0,
      lead_source: body.leadSource ? String(body.leadSource).trim() : null,
      assigned_to: body.assignedTo ? String(body.assignedTo).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      follow_up_at: body.followUpAt ? String(body.followUpAt).trim() : null,
    };

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('leads')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ lead: mapLead(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}

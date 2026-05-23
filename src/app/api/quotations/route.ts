import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapQuotation(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    quotationNumber: (row.quotation_number as string) ?? '',
    leadId: (row.lead_id as string) ?? null,
    agentId: (row.agent_id as string) ?? null,
    customerName: (row.customer_name as string) ?? '',
    customerPhone: (row.customer_phone as string) ?? '',
    customerEmail: (row.customer_email as string) ?? '',
    customerAddress: (row.customer_address as string) ?? '',
    items: (row.items as Array<Record<string, unknown>>) ?? [],
    subtotal: (row.subtotal as number) ?? 0,
    gstRate: (row.gst_rate as number) ?? 18,
    gstAmount: (row.gst_amount as number) ?? 0,
    totalAmount: (row.total_amount as number) ?? 0,
    status: (row.status as string) ?? 'Draft',
    validUntil: (row.valid_until as string) ?? null,
    notes: (row.notes as string) ?? '',
    pdfUrl: (row.pdf_url as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

function generateQuotationNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `MMQ-${yy}${mm}-${seq}`;
}

// GET /api/quotations — List all quotations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = (supabase as any)
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadId) query = query.eq('lead_id', leadId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;
    return cachedResponse({ quotations: (data || []).map(mapQuotation) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

// POST /api/quotations — Create a new quotation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.customerName) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one quotation item is required' },
        { status: 400 }
      );
    }

    const quotationNumber = generateQuotationNumber();
    const gstRate = body.gstRate ?? 18;
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + (item.total ?? item.quantity * item.unitPrice),
      0
    );
    const gstAmount = Math.round(subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    const payload: Record<string, unknown> = {
      quotation_number: quotationNumber,
      lead_id: body.leadId ? String(body.leadId).trim() : null,
      agent_id: body.agentId ? String(body.agentId).trim() : null,
      customer_name: String(body.customerName).trim(),
      customer_phone: body.customerPhone ? String(body.customerPhone).trim() : null,
      customer_email: body.customerEmail ? String(body.customerEmail).trim() : null,
      customer_address: body.customerAddress ? String(body.customerAddress).trim() : null,
      items: body.items,
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      status: body.status ? String(body.status).trim() : 'Draft',
      valid_until: body.validUntil ? String(body.validUntil).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
    };

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('quotations')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ quotation: mapQuotation(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create quotation' },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations — Update a quotation
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quotation id is required' }, { status: 400 });
    }

    const dbUpdates: Record<string, unknown> = {};

    if (updates.customerName !== undefined) dbUpdates.customer_name = String(updates.customerName).trim();
    if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone ? String(updates.customerPhone).trim() : null;
    if (updates.customerEmail !== undefined) dbUpdates.customer_email = updates.customerEmail ? String(updates.customerEmail).trim() : null;
    if (updates.customerAddress !== undefined) dbUpdates.customer_address = updates.customerAddress ? String(updates.customerAddress).trim() : null;
    if (updates.status !== undefined) dbUpdates.status = String(updates.status).trim();
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes ? String(updates.notes).trim() : null;
    if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil ? String(updates.validUntil).trim() : null;
    if (updates.pdfUrl !== undefined) dbUpdates.pdf_url = updates.pdfUrl ? String(updates.pdfUrl).trim() : null;

    // If items updated, recalculate totals
    if (updates.items && Array.isArray(updates.items)) {
      dbUpdates.items = updates.items;
      const gstRate = (dbUpdates.gst_rate as number) ?? (updates.gstRate ?? 18);
      const subtotal = updates.items.reduce(
        (sum: number, item: any) => sum + (item.total ?? item.quantity * item.unitPrice),
        0
      );
      dbUpdates.subtotal = subtotal;
      dbUpdates.gst_rate = gstRate;
      dbUpdates.gst_amount = Math.round(subtotal * gstRate) / 100;
      dbUpdates.total_amount = subtotal + (dbUpdates.gst_amount as number);
    }

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('quotations')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ quotation: mapQuotation(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update quotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations — Delete a quotation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Quotation id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}

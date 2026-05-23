import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';
import { generateInvoiceNumber, getGstInfo, calculateGst } from '@/config/gst';

function mapInvoice(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    invoiceNumber: (row.invoice_number as string) ?? '',
    quotationId: (row.quotation_id as string) ?? null,
    leadId: (row.lead_id as string) ?? null,
    gstNumber: (row.gst_number as string) ?? '',
    items: (row.items as Array<Record<string, unknown>>) ?? [],
    subtotal: (row.subtotal as number) ?? 0,
    gstRate: (row.gst_rate as number) ?? 18,
    gstAmount: (row.gst_amount as number) ?? 0,
    totalAmount: (row.total_amount as number) ?? 0,
    amountPaid: (row.amount_paid as number) ?? 0,
    balanceDue: (row.balance_due as number) ?? 0,
    status: (row.status as string) ?? 'Unpaid',
    dueDate: (row.due_date as string) ?? null,
    pdfUrl: (row.pdf_url as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

// GET /api/invoices — List invoices with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const quotationId = searchParams.get('quotationId');

    const supabase = await createClient();
    let query = (supabase as any)
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadId) query = query.eq('lead_id', leadId);
    if (status) query = query.eq('status', status);
    if (quotationId) query = query.eq('quotation_id', quotationId);

    const { data, error } = await query;

    if (error) throw error;
    return cachedResponse({ invoices: (data || []).map(mapInvoice) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices — Create a GST-compliant invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one invoice item is required' }, { status: 400 });
    }

    const invoiceNumber = generateInvoiceNumber();

    // Determine GST based on marble type and state
    const marbleTypeId = body.marbleType || body.items[0]?.marble_type || 'default';
    const gstInfo = getGstInfo(marbleTypeId);
    const customerState = body.customerState || body.businessState || 'Rajasthan';
    const businessState = body.businessState || 'Rajasthan';
    const isInterstate = customerState !== businessState;

    // Calculate items with HSN codes
    const itemsWithHsn = body.items.map((item: any) => ({
      ...item,
      hsn_code: item.hsn_code || gstInfo.hsnCode,
      gst_rate: item.gst_rate || gstInfo.gstRate,
    }));

    // Calculate totals
    const subtotal = itemsWithHsn.reduce(
      (sum: number, item: any) => sum + (item.total || (item.quantity || 0) * (item.unitPrice || item.unit_price || 0)),
      0
    );

    const gstCalc = calculateGst(subtotal, gstInfo.gstRate, isInterstate ? 'different' : 'same');

    const payload: Record<string, unknown> = {
      invoice_number: invoiceNumber,
      quotation_id: body.quotationId ? String(body.quotationId).trim() : null,
      lead_id: body.leadId ? String(body.leadId).trim() : null,
      gst_number: body.gstNumber ? String(body.gstNumber).trim() : null,
      items: itemsWithHsn,
      subtotal,
      gst_rate: gstInfo.gstRate,
      gst_amount: gstCalc.totalGst,
      total_amount: gstCalc.grandTotal,
      amount_paid: body.amountPaid ? Number(body.amountPaid) : 0,
      balance_due: gstCalc.grandTotal - (body.amountPaid ? Number(body.amountPaid) : 0),
      status: body.status ? String(body.status).trim() : 'Unpaid',
      due_date: body.dueDate ? String(body.dueDate).trim() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('invoices')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    // If from a quotation, update quotation status
    if (body.quotationId) {
      await (supabase as any)
        .from('quotations')
        .update({ status: 'Converted' })
        .eq('id', body.quotationId);
    }

    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({
      invoice: mapInvoice(row),
      gstBreakdown: {
        hsnCode: gstInfo.hsnCode,
        gstRate: gstInfo.gstRate,
        ...gstCalc,
        isInterstate,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices — Record payment or update invoice
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, amount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    if (action === 'record_payment' && amount) {
      // Get current invoice
      const { data: invoice } = await (supabase as any)
        .from('invoices')
        .select('amount_paid, total_amount')
        .eq('id', id)
        .single();

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const newAmountPaid = (invoice.amount_paid || 0) + Number(amount);
      const totalAmount = invoice.total_amount || 0;
      const balanceDue = totalAmount - newAmountPaid;

      let newStatus = 'Partially Paid';
      if (balanceDue <= 0) newStatus = 'Paid';
      else if (newAmountPaid <= 0) newStatus = 'Unpaid';

      const { data, error } = await (supabase as any)
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          balance_due: Math.max(0, balanceDue),
          status: newStatus,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      const row = data as unknown as Record<string, unknown>;
      return NextResponse.json({ invoice: mapInvoice(row) });
    }

    // Regular update
    const dbUpdates: Record<string, unknown> = {};
    if (body.status !== undefined) dbUpdates.status = String(body.status).trim();
    if (body.gstNumber !== undefined) dbUpdates.gst_number = body.gstNumber ? String(body.gstNumber).trim() : null;
    if (body.dueDate !== undefined) dbUpdates.due_date = String(body.dueDate).trim();
    if (body.pdfUrl !== undefined) dbUpdates.pdf_url = body.pdfUrl ? String(body.pdfUrl).trim() : null;

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('invoices')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ invoice: mapInvoice(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices — Delete an invoice
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Invoice id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

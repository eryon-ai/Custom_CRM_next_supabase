import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

// GET /api/customer/orders — Get customer's orders, quotations, invoices
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get('phone');

    if (!customerPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Find leads by phone
    const { data: leads } = await (supabase as any)
      .from('leads')
      .select('id, name, status, pipeline_stage, created_at')
      .ilike('phone', `%${customerPhone.replace(/[^0-9]/g, '')}%`)
      .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        orders: [],
        quotations: [],
        invoices: [],
        message: 'No orders found for this phone number',
      });
    }

    const leadIds = leads.map((l: any) => l.id);

    // Get quotations
    const { data: quotations } = await (supabase as any)
      .from('quotations')
      .select('*')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false });

    // Get invoices
    const { data: invoices } = await (supabase as any)
      .from('invoices')
      .select('*')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false });

    // Get reserved slabs
    const { data: slabs } = await (supabase as any)
      .from('slabs')
      .select('*')
      .in('reserved_for_lead', leadIds)
      .eq('status', 'Reserved');

    // Get site visits
    const { data: visits } = await (supabase as any)
      .from('site_visits')
      .select('*')
      .in('lead_id', leadIds)
      .order('scheduled_at', { ascending: true })
      .limit(5);

    return cachedResponse({
      leads: leads.map((l: any) => ({
        id: l.id,
        name: l.name,
        status: l.status,
        pipelineStage: l.pipeline_stage,
        createdAt: l.created_at,
      })),
      quotations: quotations || [],
      invoices: invoices || [],
      reservedSlabs: slabs || [],
      upcomingVisits: visits || [],
      summary: {
        totalOrders: leads.length,
        activeOrders: leads.filter((l: any) => !['Converted', 'Lost'].includes(l.status)).length,
        totalValue: (invoices || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        totalPaid: (invoices || []).reduce((s: number, i: any) => s + (i.amount_paid || 0), 0),
        pendingBalance: (invoices || []).reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.amount_paid || 0)), 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

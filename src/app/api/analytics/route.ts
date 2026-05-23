import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

// GET /api/analytics — Aggregated analytics data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6m'; // 30d, 90d, 6m, 1y

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 6m
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    }
    const startDateIso = startDate.toISOString();
    const nowIso = now.toISOString();

    // Parallel queries for all analytics
    const [
      { data: leads, error: leadsErr },
      { data: allLeads, error: allLeadsErr },
      { data: quotations, error: quotErr },
      { data: invoices, error: invErr },
      { data: activities, error: actErr },
      { data: agents, error: agentsErr },
    ] = await Promise.all([
      // Recent leads in period
      supabase
        .from('leads')
        .select('id, status, pipeline_stage, deal_value, created_at, assigned_to, lead_source')
        .gte('created_at', startDateIso)
        .lte('created_at', nowIso)
        .order('created_at', { ascending: false }),
      // All leads for total count
      supabase
        .from('leads')
        .select('id, status'),
      // Quotations in period
      supabase
        .from('quotations')
        .select('id, status, total_amount, created_at')
        .gte('created_at', startDateIso)
        .lte('created_at', nowIso),
      // Invoices in period
      supabase
        .from('invoices')
        .select('id, status, total_amount, amount_paid, created_at')
        .gte('created_at', startDateIso)
        .lte('created_at', nowIso),
      // Activities in period
      supabase
        .from('lead_activities')
        .select('id, activity_type, created_at')
        .gte('created_at', startDateIso)
        .lte('created_at', nowIso),
      // All agents
      supabase
        .from('agents')
        .select('id, name, status'),
    ]);

    if (leadsErr || allLeadsErr || quotErr || invErr || actErr || agentsErr) {
      throw leadsErr || allLeadsErr || quotErr || invErr || actErr || agentsErr;
    }

    const leadsArr = (leads || []) as Record<string, unknown>[];
    const allLeadsArr = (allLeads || []) as Record<string, unknown>[];
    const quotationsArr = (quotations || []) as Record<string, unknown>[];
    const invoicesArr = (invoices || []) as Record<string, unknown>[];
    const activitiesArr = (activities || []) as Record<string, unknown>[];
    const agentsArr = (agents || []) as Record<string, unknown>[];

    // --- KPI Cards ---
    const totalLeads = allLeadsArr.length;
    const convertedLeads = allLeadsArr.filter((l: Record<string, unknown>) => l.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const activeAgents = agentsArr.filter((a: Record<string, unknown>) => a.status === 'Active').length;
    const totalRevenue = invoicesArr.reduce((sum: number, inv: Record<string, unknown>) => sum + ((inv.amount_paid as number) || 0), 0);
    const pendingAmount = invoicesArr.reduce(
      (sum: number, inv: Record<string, unknown>) => sum + (((inv.total_amount as number) || 0) - ((inv.amount_paid as number) || 0)),
      0
    );

    // --- Monthly Revenue ---
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevMap: Record<string, { month: string; revenue: number; leads: number; conversion: number }> = {};

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevMap[key] = {
        month: monthNames[d.getMonth()]!,
        revenue: 0,
        leads: 0,
        conversion: 0,
      };
    }

    for (const inv of invoicesArr) {
      const d = new Date(inv.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevMap[key]) {
        monthlyRevMap[key]!.revenue += inv.amount_paid || 0;
      }
    }

    for (const lead of leadsArr) {
      const d = new Date(lead.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevMap[key]) {
        monthlyRevMap[key]!.leads += 1;
      }
    }

    const monthlyRevenue = Object.values(monthlyRevMap);

    // --- Lead Sources ---
    const sourceCounts: Record<string, number> = {};
    for (const lead of leadsArr) {
      const source = lead.lead_source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }
    const leadSources = Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // --- Conversion Funnel ---
    const funnelStages = ['New', 'Interested', 'Site Visit', 'Quotation Sent', 'Negotiation', 'Converted'];
    const conversionFunnel = funnelStages.map((stage) => ({
      stage,
      count: allLeadsArr.filter((l: Record<string, unknown>) => l.pipeline_stage === stage).length,
    }));

    // --- Agent Performance ---
    const agentLeadMap: Record<string, { name: string; leads: number; converted: number; revenue: number }> = {};
    for (const agent of agentsArr) {
      agentLeadMap[agent.id] = { name: agent.name, leads: 0, converted: 0, revenue: 0 };
    }
    for (const lead of leadsArr) {
      if (lead.assigned_to && agentLeadMap[lead.assigned_to]) {
        agentLeadMap[lead.assigned_to]!.leads += 1;
        if (lead.status === 'Converted') {
          agentLeadMap[lead.assigned_to]!.converted += 1;
        }
        agentLeadMap[lead.assigned_to]!.revenue += lead.deal_value || 0;
      }
    }
    const agentPerformance = Object.values(agentLeadMap)
      .filter((a) => a.leads > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // --- Activity Timeline ---
    const activityTimeline: Record<string, number> = {};
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      last7Days.push(key);
      activityTimeline[key] = 0;
    }
    for (const act of activitiesArr) {
      const key = new Date(act.created_at).toISOString().slice(0, 10);
      if (activityTimeline[key] !== undefined) {
        activityTimeline[key] += 1;
      }
    }

    return cachedResponse({
      kpis: {
        totalLeads,
        convertedLeads,
        conversionRate,
        activeAgents,
        totalRevenue,
        pendingAmount,
      },
      monthlyRevenue,
      leadSources,
      conversionFunnel,
      agentPerformance,
      activityTimeline: last7Days.map((date) => ({ date, count: activityTimeline[date] || 0 })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

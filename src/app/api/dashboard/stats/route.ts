// ============================================================
// Dashboard Stats API — Server-side aggregations
// GET /api/dashboard/stats — Returns aggregated KPIs
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();

    // Run all aggregations in parallel
    const [leadsRes, agentsRes, inventoryRes, activitiesRes] = await Promise.all([
      // Lead stats by status
      supabase
        .from('leads')
        .select('id, status, deal_value', { count: 'exact', head: false }),

      // Agent count
      supabase
        .from('agents')
        .select('id, status', { count: 'exact', head: false }),

      // Low stock inventory
      supabase
        .from('inventory_items')
        .select('id, name, quantity_available, min_stock_level, unit, unit_price')
        .filter('status', 'neq', 'Discontinued'),

      // Recent activities (last 20)
      supabase
        .from('lead_activities')
        .select('*, leads(name)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // ── Process Leads ──
    const allLeads = leadsRes.data || [];
    const totalLeads = allLeads.length;
    const byStatus: Record<string, number> = {};
    let totalPipelineValue = 0;
    let lostDeals = 0;
    let wonDeals = 0;

    allLeads.forEach((lead: Record<string, unknown>) => {
      const status = (lead.status as string) || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      totalPipelineValue += (lead.deal_value as number) || 0;
      if (status === 'Converted') wonDeals++;
      if (status === 'Lost') lostDeals++;
    });

    const conversionRate = totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0;
    const winLossRatio = lostDeals > 0 ? (wonDeals / lostDeals).toFixed(1) : wonDeals > 0 ? '∞' : '0';

    // ── Process Agents ──
    const allAgents = agentsRes.data || [];
    const activeAgents = allAgents.filter((a: Record<string, unknown>) => a.status === 'Active').length;

    // ── Process Inventory ──
    const allInventory = inventoryRes.data || [];
    const lowStockItems = allInventory.filter(
      (i: Record<string, unknown>) => (i.quantity_available as number) <= (i.min_stock_level as number) && (i.quantity_available as number) > 0
    );
    const outOfStockItems = allInventory.filter(
      (i: Record<string, unknown>) => (i.quantity_available as number) === 0 || (i.quantity_available as number) <= 0
    );
    const inventoryValue = allInventory.reduce(
      (sum: number, i: Record<string, unknown>) => sum + ((i.quantity_available as number) || 0) * ((i.unit_price as number) || 0),
      0
    );

    // ── Process Activities ──
    const recentActivities = (activitiesRes.data || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      leadId: a.lead_id as string,
      leadName: ((a.leads as Record<string, unknown>)?.name as string) || 'Unknown',
      type: a.activity_type as string,
      description: a.description as string,
      createdAt: a.created_at as string,
    }));

    // ── Lead Status Distribution ──
    const statusDistribution = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    }));

    // ── Pipeline Stage Distribution ──
    const byStage: Record<string, number> = {};
    allLeads.forEach((lead: Record<string, unknown>) => {
      const stage = (lead.pipeline_stage as string) || (lead.status as string) || 'Unknown';
      byStage[stage] = (byStage[stage] || 0) + 1;
    });
    const stageDistribution = Object.entries(byStage).map(([stage, count]) => ({
      stage,
      count,
    }));

    return cachedResponse({
      kpis: {
        totalLeads,
        totalPipelineValue,
        conversionRate,
        winLossRatio,
        activeAgents,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        inventoryValue,
        wonDeals,
        lostDeals,
      },
      statusDistribution,
      stageDistribution,
      recentActivities,
    });
  } catch (error) {
    console.error('[dashboard/stats] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

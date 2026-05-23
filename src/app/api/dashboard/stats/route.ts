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
      (supabase as any)
        .from('leads')
        .select('id, status, deal_value', { count: 'exact', head: false }),

      // Agent count
      (supabase as any)
        .from('agents')
        .select('id, status', { count: 'exact', head: false }),

      // Low stock inventory
      (supabase as any)
        .from('inventory_items')
        .select('id, name, quantity_available, min_stock_level, unit, unit_price')
        .filter('status', 'neq', 'Discontinued'),

      // Recent activities (last 20)
      (supabase as any)
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

    allLeads.forEach((lead: any) => {
      const status = lead.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      totalPipelineValue += lead.deal_value || 0;
      if (status === 'Converted') wonDeals++;
      if (status === 'Lost') lostDeals++;
    });

    const conversionRate = totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0;
    const winLossRatio = lostDeals > 0 ? (wonDeals / lostDeals).toFixed(1) : wonDeals > 0 ? '∞' : '0';

    // ── Process Agents ──
    const allAgents = agentsRes.data || [];
    const activeAgents = allAgents.filter((a: any) => a.status === 'Active').length;

    // ── Process Inventory ──
    const allInventory = inventoryRes.data || [];
    const lowStockItems = allInventory.filter(
      (i: any) => i.quantity_available <= i.min_stock_level && i.quantity_available > 0
    );
    const outOfStockItems = allInventory.filter(
      (i: any) => i.quantity_available === 0 || i.quantity_available <= 0
    );
    const inventoryValue = allInventory.reduce(
      (sum: number, i: any) => sum + (i.quantity_available || 0) * (i.unit_price || 0),
      0
    );

    // ── Process Activities ──
    const recentActivities = (activitiesRes.data || []).map((a: any) => ({
      id: a.id,
      leadId: a.lead_id,
      leadName: a.leads?.name || 'Unknown',
      type: a.activity_type,
      description: a.description,
      createdAt: a.created_at,
    }));

    // ── Lead Status Distribution ──
    const statusDistribution = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    }));

    // ── Pipeline Stage Distribution ──
    const byStage: Record<string, number> = {};
    allLeads.forEach((lead: any) => {
      const stage = lead.pipeline_stage || lead.status || 'Unknown';
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

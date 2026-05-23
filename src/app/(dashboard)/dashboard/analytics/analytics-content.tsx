'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useAnalyticsQuery } from '@/hooks/use-queries';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalyticsQuery('6m');
  const [view, setView] = useState<'revenue' | 'conversion' | 'agents'>('revenue');

  // Type-safe accessors
  const typedData = data;
  const kpis = typedData?.kpis;
  const monthlyRevenue = typedData?.monthlyRevenue || [];
  const leadSources = typedData?.leadSources || [];
  const conversionFunnel = typedData?.conversionFunnel || [];
  const agentPerformance = typedData?.agentPerformance || [];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64 mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !typedData) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error ? (error as Error).message : 'No analytics data yet.'}</p>
          <button className="mt-4 text-primary underline" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Enterprise performance dashboards</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold">{kpis.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
            <p className="text-2xl font-bold text-emerald-500">{kpis.conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Agents</p>
            <p className="text-2xl font-bold text-blue-500">{kpis.activeAgents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart View Toggle */}
      <div className="flex gap-2">
        {[
          { id: 'revenue', label: 'Revenue' },
          { id: 'conversion', label: 'Conversion Funnel' },
          { id: 'agents', label: 'Agent Performance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      {view === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {leadSources.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {leadSources.map( (_: Record<string, unknown>, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No leads yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Funnel */}
      {view === 'conversion' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {conversionFunnel.some((s: Record<string, unknown>) => s.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="stage" type="category" className="text-xs" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                      {conversionFunnel.map( (_: Record<string, unknown>, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No pipeline data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Performance */}
      {view === 'agents' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {agentPerformance.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#3b82f6" name="Total Leads" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="converted" fill="#10b981" name="Converted" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 font-medium">Agent</th>
                        <th className="pb-2 font-medium text-right">Leads</th>
                        <th className="pb-2 font-medium text-right">Converted</th>
                        <th className="pb-2 font-medium text-right">Revenue</th>
                        <th className="pb-2 font-medium text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {agentPerformance.map((agent: Record<string, unknown>) => (
                        <tr key={agent.name}>
                          <td className="py-2 font-medium">{agent.name}</td>
                          <td className="py-2 text-right">{agent.leads}</td>
                          <td className="py-2 text-right">{agent.converted}</td>
                          <td className="py-2 text-right">{formatCurrency(agent.revenue)}</td>
                          <td className="py-2 text-right">{agent.leads > 0 ? ((agent.converted / agent.leads) * 100).toFixed(0) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No agent performance data yet</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


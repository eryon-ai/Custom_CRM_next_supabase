import { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { Users, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useDashboardStatsQuery } from '@/hooks/use-queries';

// Dynamic import — recharts is 100kB+, only loaded when on Dashboard tab
const LeadStatusChart = dynamic(() => import('./LeadStatusChart').then((m) => m.LeadStatusChart), { ssr: false });

interface DashboardViewProps {
  leads: any[];
  agents: any[];
}

export const DashboardView = memo(function DashboardView({ leads, agents }: DashboardViewProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery();

  const kpis = useMemo(() => {
    if (statsLoading || !stats) return null;
    const s = stats.kpis;
    return [
      { title: 'Total Leads', value: s.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
      { title: 'Active Agents', value: s.activeAgents, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
      { title: 'Pipeline Value', value: formatCurrency(s.totalPipelineValue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
      { title: 'Conversion Rate', value: `${s.conversionRate}%`, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    ];
  }, [stats, statsLoading]);

  const statusData = stats?.statusDistribution || [];
  const activities = stats?.recentActivities || [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border p-4"><Skeleton className="h-64 w-full" /></div>
          <div className="rounded-xl border p-4"><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top KPI Stats — single source of truth */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Second row: Lead Status Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Status Distribution — Pie Chart (dynamically loaded) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <LeadStatusChart data={statusData} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No lead data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div className={`p-1.5 rounded-full mt-0.5 ${
                      act.type === 'Email' ? 'bg-blue-100 text-blue-600' :
                      act.type === 'Call' ? 'bg-green-100 text-green-600' :
                      act.type === 'Meeting' ? 'bg-purple-100 text-purple-600' :
                      act.type === 'Note' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <div className="w-3 h-3 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{act.leadName}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{act.description || act.type}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(act.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{act.type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third row: Recent Leads + Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 font-medium">Client Name</th>
                    <th className="pb-3 font-medium">Marble Type</th>
                    <th className="pb-3 font-medium">Quantity</th>
                    <th className="pb-3 font-medium">Deal Value</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id}>
                      <td className="py-3 font-medium text-foreground">{lead.name}</td>
                      <td className="py-3 text-muted-foreground">{lead.marbleType || '—'}</td>
                      <td className="py-3 text-muted-foreground">{lead.quantity || '—'}</td>
                      <td className="py-3 font-medium">{formatCurrency(lead.dealValue || 0)}</td>
                      <td className="py-3">
                        <Badge variant={lead.status === 'Converted' ? 'default' : 'outline'}>
                          {lead.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No leads yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.last_active_at ? `Active ${formatRelativeTime(agent.last_active_at)}` : 'No activity'}
                    </p>
                  </div>
                  <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                    {agent.status || 'Offline'}
                  </Badge>
                </div>
              ))}
              {agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No agents yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

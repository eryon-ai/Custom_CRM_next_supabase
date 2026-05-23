'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { LeadsView } from '@/components/crm/views/LeadsView';
import { AgentsView } from '@/components/crm/views/AgentsView';
import { LocationsView } from '@/components/crm/views/LocationsView';
import { useUIStore } from '@/stores/ui-store';
import { useLeadsQuery, useAgentsQuery, useLocationsQuery } from '@/hooks/use-queries';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/hooks/use-queries';

type TabId = 'dashboard' | 'leads' | 'agents' | 'locations';

const tabs = [
  { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads' as TabId, label: 'Leads', icon: Users },
  { id: 'agents' as TabId, label: 'Agents', icon: Users },
  { id: 'locations' as TabId, label: 'Locations', icon: MapPin },
];

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useUIStore();
  const [error, setError] = useState('');
  const [agentsError, setAgentsError] = useState('');
  const queryClient = useQueryClient();

  // React Query — cached, deduplicated, no refetch on mount
  const { data: leadsData, isLoading: leadsLoading, isError: leadsError } = useLeadsQuery();
  const { data: agentsData, isLoading: agentsLoading } = useAgentsQuery();
  const { data: locationsData, isLoading: locsLoading } = useLocationsQuery();

  const leads = leadsData?.leads || [];
  const agents = agentsData?.agents || [];
  const locations = locationsData?.locations || [];

  const isLoading = leadsLoading || agentsLoading || locsLoading;

  async function handleCreateLead(leadInput: Record<string, unknown>) {
    try {
      setError('');
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadInput),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create lead');
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  async function handleCreateAgent(agentInput: Record<string, unknown>) {
    try {
      setAgentsError('');
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentInput),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create agent');
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      return true;
    } catch (err) {
      setAgentsError((err as Error).message);
      return false;
    }
  }

  async function handleAdvanceLeadStatus(leadId: string, currentStatus: string) {
    const order = ['New', 'Contacted', 'Converted', 'Lost'];
    const currentIndex = order.indexOf(currentStatus);
    const nextStatus = order[(currentIndex + 1) % order.length];

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not update lead status');
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // ── Render ──
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400 border border-red-200 rounded-lg px-3 py-2">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border p-4 bg-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border p-4 bg-card">
              <Skeleton className="h-5 w-28 mb-4" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full mb-2" />
              ))}
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <Skeleton className="h-5 w-28 mb-4" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && activeTab === 'dashboard' && (
        <DashboardView leads={leads} agents={agents} />
      )}
      {activeTab === 'leads' && (
        <LeadsView
          leads={leads}
          agents={agents}
          onCreateLead={handleCreateLead}
          onAdvanceStatus={handleAdvanceLeadStatus}
          loading={leadsLoading}
          error={error}
        />
      )}
      {activeTab === 'agents' && (
        <AgentsView
          agents={agents}
          error={agentsError}
          onCreateAgent={handleCreateAgent}
        />
      )}
      {activeTab === 'locations' && (
        <LocationsView locations={locations} />
      )}
    </div>
  );
}

// ============================================================
// React Query Hooks — Centralized cached data fetching
// Replaces manual useState+useEffect+fetch across all pages
// ============================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Generic cached fetcher ──
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function mutator<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Query Keys ──
export const queryKeys = {
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  agents: ['agents'] as const,
  locations: ['locations'] as const,
  pipeline: ['pipeline'] as const,
  quotations: ['quotations'] as const,
  inventory: ['inventory'] as const,
  analytics: (period: string) => ['analytics', period] as const,
  invoices: (filters: Record<string, string>) => ['invoices', filters] as const,
  slabs: (filters: Record<string, string>) => ['slabs', filters] as const,
  siteVisits: (filters: Record<string, string>) => ['site-visits', filters] as const,
  workflow: ['workflow'] as const,
  dashboardStats: ['dashboard-stats'] as const,
};

// ════════════ LEADS ════════════
export function useLeadsQuery() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: () => fetcher<{ leads: any[] }>('/api/leads'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useLeadQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.lead(id || ''),
    queryFn: () => fetcher<{ lead: any }>(`/api/leads/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mutator<{ lead: any }>('/api/leads', 'POST', body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leads, (old: any) => ({
        leads: [data.lead, ...(old?.leads || [])],
      }));
    },
  });
}

export function useUpdateLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      mutator<{ lead: any }>(`/api/leads/${id}`, 'PATCH', body),
    onSuccess: (data, vars) => {
      qc.setQueryData(queryKeys.leads, (old: any) => ({
        leads: (old?.leads || []).map((l: any) =>
          l.id === vars.id ? { ...l, ...data.lead } : l
        ),
      }));
    },
  });
}

// ════════════ AGENTS ════════════
export function useAgentsQuery() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => fetcher<{ agents: any[] }>('/api/agents'),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ════════════ CREATE AGENT ════════════
export function useCreateAgentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mutator<{ agent: any }>('/api/agents', 'POST', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  });
}

// ════════════ LOCATIONS ════════════
export function useLocationsQuery() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => fetcher<{ locations: any[] }>('/api/locations'),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ════════════ PIPELINE ════════════
export function usePipelineQuery() {
  return useQuery({
    queryKey: queryKeys.pipeline,
    queryFn: () => fetcher<{ leads: any[] }>('/api/pipeline'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ════════════ QUOTATIONS ════════════
export function useQuotationsQuery() {
  return useQuery({
    queryKey: queryKeys.quotations,
    queryFn: () => fetcher<{ quotations: any[] }>('/api/quotations'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mutator<{ quotation: any }>('/api/quotations', 'POST', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.quotations }),
  });
}

export function useDeleteQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/quotations?id=${encodeURIComponent(id)}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.quotations }),
  });
}

export function useUpdateQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string } & Record<string, unknown>) =>
      mutator<{ quotation: any }>('/api/quotations', 'PATCH', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.quotations }),
  });
}

// ════════════ INVENTORY ════════════
export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () => fetcher<{ items: any[] }>('/api/inventory'),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateInventoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mutator<{ item: any }>('/api/inventory', 'POST', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: queryKeys.analytics('6m') });
    },
  });
}

export function useDeleteInventoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/inventory?id=${encodeURIComponent(id)}`, 'DELETE'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: queryKeys.analytics('6m') });
    },
  });
}

export function useUpdateInventoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string } & Record<string, unknown>) =>
      mutator<{ item: any }>('/api/inventory', 'PATCH', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: queryKeys.analytics('6m') });
    },
  });
}

// ════════════ ANALYTICS ════════════
export function useAnalyticsQuery(period = '6m') {
  return useQuery({
    queryKey: queryKeys.analytics(period),
    queryFn: () => fetcher<any>(`/api/analytics?period=${period}`),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ════════════ WORKFLOW ════════════
export function useWorkflowQuery() {
  return useQuery({
    queryKey: queryKeys.workflow,
    queryFn: () => fetcher<{ rules: any[] }>('/api/workflow'),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// ════════════ MARBLE IMAGES ════════════
export function useMarbleImagesQuery(marbleId: string | null) {
  return useQuery({
    queryKey: ['marble-images', marbleId],
    queryFn: () => fetcher<{ images: { name: string; url: string; createdAt: string }[] }>(
      `/api/marbles/images?marbleId=${marbleId}`
    ),
    enabled: !!marbleId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

// ════════════ DASHBOARD STATS ════════════
export interface DashboardStats {
  kpis: {
    totalLeads: number;
    totalPipelineValue: number;
    conversionRate: number;
    winLossRatio: string;
    activeAgents: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
    wonDeals: number;
    lostDeals: number;
  };
  statusDistribution: { status: string; count: number; percentage: number }[];
  stageDistribution: { stage: string; count: number }[];
  recentActivities: { id: string; leadId: string; leadName: string; type: string; description: string; createdAt: string }[];
}

export function useDashboardStatsQuery() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => fetcher<DashboardStats>('/api/dashboard/stats'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}


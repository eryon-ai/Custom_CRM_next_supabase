import { create } from 'zustand';
import type { LeadCard, LeadFilters, SortConfig } from '@/types/crm';

// ============================================================
// Lead Store — Lead data & filters
// ============================================================

export interface LeadState {
  leads: LeadCard[];
  filters: LeadFilters;
  sort: SortConfig;
  selectedLeadId: string | null;
  isLoading: boolean;
  error: string | null;
  filteredLeads: LeadCard[]; // Memoized derived state

  setLeads: (leads: LeadCard[]) => void;
  addLead: (lead: LeadCard) => void;
  updateLead: (id: string, updates: Partial<LeadCard>) => void;
  removeLead: (id: string) => void;
  setFilters: (filters: Partial<LeadFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortConfig) => void;
  selectLead: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function computeFilteredLeads(
  leads: LeadCard[],
  filters: LeadFilters,
  sort: SortConfig
): LeadCard[] {
  let filtered = [...leads];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.marbleType.toLowerCase().includes(q) ||
        l.siteLocation.toLowerCase().includes(q)
    );
  }
  if (filters.pipelineStage) {
    filtered = filtered.filter((l) => l.pipelineStage === filters.pipelineStage);
  }
  if (filters.status) {
    filtered = filtered.filter((l) => l.status === filters.status);
  }
  if (filters.assignedTo) {
    filtered = filtered.filter((l) => l.assignedTo === filters.assignedTo);
  }
  if (filters.leadSource) {
    filtered = filtered.filter((l) => l.leadSource === filters.leadSource);
  }

  filtered.sort((a, b) => {
    const aVal = a[sort.key as keyof LeadCard] ?? '';
    const bVal = b[sort.key as keyof LeadCard] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal));
    return sort.direction === 'asc' ? cmp : -cmp;
  });

  return filtered;
}

const defaultFilters: LeadFilters = {};
const defaultSort: SortConfig = { key: 'createdAt', direction: 'desc' };

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  filters: defaultFilters,
  sort: defaultSort,
  selectedLeadId: null,
  isLoading: false,
  error: null,
  filteredLeads: [],

  setLeads: (leads) => {
    const { filters, sort } = get();
    set({
      leads,
      filteredLeads: computeFilteredLeads(leads, filters, sort),
      isLoading: false,
    });
  },
  addLead: (lead) => {
    const newLeads = [lead, ...get().leads];
    const { filters, sort } = get();
    set({
      leads: newLeads,
      filteredLeads: computeFilteredLeads(newLeads, filters, sort),
    });
  },
  updateLead: (id, updates) =>
    set((state) => {
      const newLeads = state.leads.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      );
      return {
        leads: newLeads,
        filteredLeads: computeFilteredLeads(newLeads, state.filters, state.sort),
      };
    }),
  removeLead: (id) =>
    set((state) => {
      const newLeads = state.leads.filter((l) => l.id !== id);
      return {
        leads: newLeads,
        filteredLeads: computeFilteredLeads(newLeads, state.filters, state.sort),
      };
    }),
  setFilters: (filters) =>
    set((state) => {
      const newFilters = { ...state.filters, ...filters };
      return {
        filters: newFilters,
        filteredLeads: computeFilteredLeads(state.leads, newFilters, state.sort),
      };
    }),
  resetFilters: () =>
    set((state) => ({
      filters: defaultFilters,
      filteredLeads: computeFilteredLeads(state.leads, defaultFilters, state.sort),
    })),
  setSort: (sort) =>
    set((state) => ({
      sort,
      filteredLeads: computeFilteredLeads(state.leads, state.filters, sort),
    })),
  selectLead: (id) => set({ selectedLeadId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

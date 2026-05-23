import { create } from 'zustand';
import type { PipelineStage } from '@/types/database';
import type { LeadCard, PipelineColumn } from '@/types/crm';
import { PIPELINE_STAGES } from '@/lib/utils';

// ============================================================
// Pipeline Store — Kanban board state
// ============================================================

const initialColumns: PipelineColumn[] = PIPELINE_STAGES.map((stage) => ({
  id: stage.id as PipelineStage,
  title: stage.label,
  leads: [],
  color: stage.color,
}));

export interface PipelineState {
  columns: PipelineColumn[];
  isLoading: boolean;
  error: string | null;

  setLeads: (leads: LeadCard[]) => void;
  moveLead: (leadId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  reorderLead: (leadId: string, stage: PipelineStage, fromIndex: number, toIndex: number) => void;
  addLead: (lead: LeadCard) => void;
  updateLead: (leadId: string, updates: Partial<LeadCard>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getStageLeads: (stage: PipelineStage) => LeadCard[];
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  columns: initialColumns,
  isLoading: false,
  error: null,

  setLeads: (leads) => {
    const columns = initialColumns.map((col) => ({
      ...col,
      leads: leads.filter((l) => l.pipelineStage === col.id),
    }));
    set({ columns, isLoading: false });
  },

  moveLead: (leadId, fromStage, toStage) => {
    const columns = get().columns.map((col) => {
      if (col.id === fromStage) {
        return { ...col, leads: col.leads.filter((l) => l.id !== leadId) };
      }
      if (col.id === toStage) {
        const lead = get()
          .columns.find((c) => c.id === fromStage)
          ?.leads.find((l) => l.id === leadId);
        if (lead) {
          return {
            ...col,
            leads: [{ ...lead, pipelineStage: toStage }, ...col.leads],
          };
        }
      }
      return col;
    });
    set({ columns });
  },

  reorderLead: (leadId, stage, _fromIndex, toIndex) => {
    const columns = get().columns.map((col) => {
      if (col.id !== stage) return col;
      const leads = [...col.leads];
      const idx = leads.findIndex((l) => l.id === leadId);
      if (idx === -1) return col;
      const [item] = leads.splice(idx, 1);
      if (!item) return col;
      leads.splice(toIndex, 0, item);
      return { ...col, leads };
    });
    set({ columns });
  },

  addLead: (lead) => {
    const columns = get().columns.map((col) => {
      if (col.id === lead.pipelineStage) {
        return { ...col, leads: [lead, ...col.leads] };
      }
      return col;
    });
    set({ columns });
  },

  updateLead: (leadId, updates) => {
    const columns = get().columns.map((col) => ({
      ...col,
      leads: col.leads.map((l) =>
        l.id === leadId ? { ...l, ...updates } : l
      ),
    }));
    set({ columns });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getStageLeads: (stage) => {
    return get().columns.find((c) => c.id === stage)?.leads ?? [];
  },
}));

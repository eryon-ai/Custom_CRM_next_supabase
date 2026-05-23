'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePipelineStore } from '@/stores/pipeline-store';
import { usePipelineQuery } from '@/hooks/use-queries';
import { PipelineColumn } from './PipelineColumn';
import { PipelineLeadCard } from './PipelineLeadCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeadCard, PipelineColumn as PipelineColumnType } from '@/types/crm';
import { mapLeadToCard } from '@/types/crm';
import type { PipelineStage } from '@/types/database';

const PIPELINE_STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'New', label: 'New', color: 'border-t-blue-500' },
  { id: 'Interested', label: 'Interested', color: 'border-t-indigo-500' },
  { id: 'Site Visit', label: 'Site Visit', color: 'border-t-purple-500' },
  { id: 'Quotation Sent', label: 'Quotation Sent', color: 'border-t-amber-500' },
  { id: 'Negotiation', label: 'Negotiation', color: 'border-t-orange-500' },
  { id: 'Converted', label: 'Converted', color: 'border-t-emerald-500' },
  { id: 'Lost', label: 'Lost', color: 'border-t-red-500' },
];

export function KanbanBoard() {
  const { columns, moveLead } = usePipelineStore();
  const { data, isLoading, error: storeError } = usePipelineQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localErrorMsg, setLocalError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Load pipeline data into store via React Query
  useEffect(() => {
    if (data?.leads) {
      usePipelineStore.getState().setLeads(
        (data.leads || []).map(mapLeadToCard)
      );
    }
  }, [data]);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const found = col.leads.find((l) => l.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCol = columns.find((c) =>
      c.leads.some((l) => l.id === active.id)
    );
    const overCol = columns.find((c) =>
      c.id === over.id || c.leads.some((l) => l.id === over.id)
    );

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;
    moveLead(active.id as string, activeCol.id, overCol.id);
  }, [columns, moveLead]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const targetCol = columns.find((c) =>
      c.id === over.id || c.leads.some((l) => l.id === over.id)
    );

    if (!targetCol) return;

    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: active.id,
          pipelineStage: targetCol.id,
        }),
      });

      if (!res.ok) {
        // Revert on failure — reload from server
        const loadRes = await fetch('/api/pipeline');
        const json = await loadRes.json();
        if (loadRes.ok) {
          const mapped = (json.leads || []).map(mapLeadToCard);
          usePipelineStore.getState().setLeads(mapped);
        }
      }
    } catch {
      setLocalError('Failed to save pipeline move');
    }
  }, [columns]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72 space-y-3">
            <Skeleton className="h-8 w-32" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(localErrorMsg || storeError) && (
        <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg px-3 py-2">
          {localErrorMsg || (storeError instanceof Error ? storeError.message : String(storeError))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
          {PIPELINE_STAGES.map((stage) => {
            const column = columns.find((c) => c.id === stage.id);
            const stageLeads = column?.leads || [];

            return (
              <SortableContext
                key={stage.id}
                items={stageLeads.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <PipelineColumn
                  id={stage.id}
                  title={stage.label}
                  color={stage.color}
                  count={stageLeads.length}
                  leads={stageLeads}
                />
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 opacity-90">
              <PipelineLeadCard lead={activeLead} isDragOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

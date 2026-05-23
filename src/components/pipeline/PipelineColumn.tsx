'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { PipelineLeadCard } from './PipelineLeadCard';
import type { LeadCard } from '@/types/crm';
import type { PipelineStage } from '@/types/database';

interface PipelineColumnProps {
  id: PipelineStage;
  title: string;
  color: string;
  count: number;
  leads: LeadCard[];
}

export function PipelineColumn({ id, title, color, count, leads }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 flex flex-col rounded-xl border bg-card/50 backdrop-blur border-t-2 transition-colors',
        color,
        isOver && 'ring-2 ring-primary/30 bg-accent/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', color.replace('border-t-', 'bg-'))} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <PipelineLeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}

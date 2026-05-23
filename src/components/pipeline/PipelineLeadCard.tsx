'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatCurrency } from '@/lib/utils';
import type { LeadCard } from '@/types/crm';

interface PipelineLeadCardProps {
  lead: LeadCard;
  isDragOverlay?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

export const PipelineLeadCard = memo(function PipelineLeadCard({
  lead,
  isDragOverlay,
}: PipelineLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        'will-change-transform', // GPU-accelerated drag
        isDragging && 'opacity-50 shadow-lg',
        isDragOverlay && 'shadow-xl ring-2 ring-primary'
      )}
    >
      {/* Lead name & score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
          {lead.name}
        </p>
        {lead.leadScore > 0 && (
          <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', getScoreColor(lead.leadScore))} />
        )}
      </div>

      {/* Details */}
      <div className="space-y-1 mb-2">
        <p className="text-xs text-muted-foreground line-clamp-1">{lead.marbleType}</p>
        {lead.dealValue > 0 && (
          <p className="text-xs font-semibold text-foreground">
            {formatCurrency(lead.dealValue)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{lead.phone}</p>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-1.5">
          {lead.assignedTo ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px]">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-5 w-5 rounded-full bg-muted" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {lead.leadSource || 'Direct'}
          </span>
        </div>
        {lead.probability > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {lead.probability}%
          </span>
        )}
      </div>
    </div>
  );
});

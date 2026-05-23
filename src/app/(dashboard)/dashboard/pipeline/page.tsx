'use client';

import { KanbanBoard } from '@/components/pipeline/KanbanBoard';

export default function PipelinePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop leads between pipeline stages
          </p>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}

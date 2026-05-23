'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AnalyticsContent = dynamic(() => import('./analytics-content'), {
  loading: () => (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  ),
  ssr: false,
});

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 mt-2" />
      <Skeleton className="h-10 w-96 rounded-lg mt-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="h-48 rounded-xl" />))}
      </div>
    </div>
  );
}

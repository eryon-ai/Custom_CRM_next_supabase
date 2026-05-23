import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48 mt-2" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-72 w-72 rounded-xl" />
        <Skeleton className="h-72 w-72 rounded-xl" />
        <Skeleton className="h-72 w-72 rounded-xl" />
      </div>
    </div>
  );
}

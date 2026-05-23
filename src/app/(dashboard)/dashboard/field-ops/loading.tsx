import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-[60vh] w-full rounded-xl mt-4" />
    </div>
  );
}

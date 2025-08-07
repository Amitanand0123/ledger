import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function JobCardSkeleton() {
  return (
    <div className="w-full border rounded-lg p-2 bg-card">
        <div className="grid grid-cols-[auto_40px_1fr_1fr] md:grid-cols-[auto_40px_1.5fr_1.5fr_1fr_1fr_1fr_1fr_40px] items-center gap-x-2">
            <Skeleton className="h-5 w-5 rounded-sm" />
            <Skeleton className="h-6 w-6 rounded-sm" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 md:hidden" />
            </div>
            <Skeleton className="h-4 w-3/4 hidden md:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-3/4 hidden md:block" />
            <Skeleton className="h-4 w-2/3 hidden md:block" />
            <Skeleton className="h-4 w-2/3 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-md" />
        </div>
    </div>
  );
}
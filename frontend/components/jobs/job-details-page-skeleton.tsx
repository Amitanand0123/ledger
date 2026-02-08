'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function JobDetailsPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            {/* Back button */}
            <Skeleton className="h-8 w-40" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                </div>
            </div>

            {/* Tabs */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Tab content */}
            <div className="space-y-4 mt-6">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-6 w-40 mt-6" />
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}

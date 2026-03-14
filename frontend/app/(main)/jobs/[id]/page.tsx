'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    useEffect(() => {
        // Job details are now shown in the dashboard split panel
        router.replace('/');
    }, [router, jobId]);

    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            Redirecting...
        </div>
    );
}

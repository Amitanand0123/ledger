'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import { useGetJobByIdQuery } from '@/lib/redux/slices/jobsApiSlice';
import { useAppSelector } from '@/lib/redux/hooks';
import { JobDetailsPageContent } from '@/components/jobs/job-details-page-content';
import { JobDetailsPageSkeleton } from '@/components/jobs/job-details-page-skeleton';
import { JobNotFound } from '@/components/jobs/job-not-found';

function JobDetailsInner() {
    const params = useParams();
    const jobId = params.id as string;
    const { data: session, status: authStatus } = useSession();
    const isGuest = authStatus === 'unauthenticated';

    const guestJobs = useAppSelector((state) => state.guestJobs.jobs);
    const guestJob = isGuest ? guestJobs.find((j) => j.id === jobId) : null;

    const { data: apiJob, isLoading, error } = useGetJobByIdQuery(jobId, {
        skip: isGuest || authStatus === 'loading',
    });

    if (authStatus === 'loading' || (!isGuest && isLoading)) {
        return <JobDetailsPageSkeleton />;
    }

    const job = isGuest ? guestJob : apiJob;

    if (!job || error) {
        return <JobNotFound />;
    }

    return <JobDetailsPageContent job={job} isGuest={isGuest} />;
}

export default function JobDetailsPage() {
    return (
        <Suspense fallback={<JobDetailsPageSkeleton />}>
            <JobDetailsInner />
        </Suspense>
    );
}

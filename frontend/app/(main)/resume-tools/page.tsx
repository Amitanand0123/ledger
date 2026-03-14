'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams, redirect } from 'next/navigation';
import { ResumeToolsWizard } from '@/components/resume-tools/resume-tools-wizard';
import { useGetJobByIdQuery } from '@/lib/redux/slices/jobsApiSlice';
import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { Loader2 } from 'lucide-react';
import type { WizardData } from '@/components/resume-tools/resume-tools-wizard';

export default function ResumeToolsPage() {
    const { status } = useSession();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');

    const { data: job, isLoading: isJobLoading } = useGetJobByIdQuery(jobId!, {
        skip: !jobId,
    });

    const { data: resumes } = useGetDocumentsQuery('RESUME', {
        skip: !jobId || !job?.resumeId,
    });

    if (status === 'loading') {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        redirect('/login');
    }

    if (jobId && isJobLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    let initialData: Partial<WizardData> | undefined;
    if (job) {
        const resume = resumes?.find(r => r.id === job.resumeId);
        const hasLatex = !!(resume?.latexSource?.trim());
        initialData = {
            position: job.position || '',
            company: job.company || '',
            location: job.location || '',
            jobDescription: job.description || '',
            selectedResumeId: job.resumeId || '',
            selectedResumeHasLatex: hasLatex,
        };
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ResumeToolsWizard initialData={initialData} sourceJobId={jobId} />
        </div>
    );
}

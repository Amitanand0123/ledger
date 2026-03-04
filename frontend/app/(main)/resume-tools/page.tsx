'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ResumeToolsWizard } from '@/components/resume-tools/resume-tools-wizard';
import { Loader2 } from 'lucide-react';

export default function ResumeToolsPage() {
    const { status } = useSession();

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

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Resume Tools</h1>
                <p className="mt-2 text-muted-foreground">
                    Score your resume against a job description or generate a tailored resume.
                </p>
            </div>
            <ResumeToolsWizard />
        </div>
    );
}

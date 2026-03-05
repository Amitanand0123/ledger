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
        <div className="container mx-auto px-4 py-8">
            <ResumeToolsWizard />
        </div>
    );
}

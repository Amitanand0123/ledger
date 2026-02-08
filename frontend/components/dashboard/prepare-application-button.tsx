'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';
import { ApplicationPreparationWizard } from './application-preparation-wizard';

interface PrepareApplicationButtonProps {
    jobId: string;
    jobPosition: string;
    jobCompany: string;
    jobStatus: string;
}

/**
 * Shows a "Prepare Application" button for jobs in INTERESTED or PREPARING status.
 * Opens the Application Preparation Wizard when clicked.
 *
 * Usage:
 * <PrepareApplicationButton
 *   jobId={job.id}
 *   jobPosition={job.position}
 *   jobCompany={job.company}
 *   jobStatus={job.status}
 * />
 */
export function PrepareApplicationButton({
    jobId,
    jobPosition,
    jobCompany,
    jobStatus,
}: PrepareApplicationButtonProps) {
    const [showWizard, setShowWizard] = useState(false);

    // Only show button for pre-application statuses
    const shouldShowButton = jobStatus === 'INTERESTED' || jobStatus === 'PREPARING';

    if (!shouldShowButton) {
        return null;
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                onClick={() => setShowWizard(true)}
            >
                <Sparkles className="mr-2 h-4 w-4" />
                Prepare Application
            </Button>

            <ApplicationPreparationWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                jobId={jobId}
                jobPosition={jobPosition}
                jobCompany={jobCompany}
            />
        </>
    );
}

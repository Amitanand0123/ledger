'use client';

import { JobApplication } from '@/lib/types';
import { FileText } from 'lucide-react';

interface JobDescriptionTabProps {
    job: JobApplication;
}

export function JobDescriptionTab({ job }: JobDescriptionTabProps) {
    if (!job.description) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No description available</p>
                <p className="text-xs mt-1">Edit this job to add a description</p>
            </div>
        );
    }

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm">{job.description}</p>
        </div>
    );
}

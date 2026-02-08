'use client';

import { JobApplication } from '@/lib/types';
import { JobInterviewsSection } from '@/components/dashboard/job-interviews-section';
import { JobNotesSection } from '@/components/dashboard/job-notes-section';
import { useAppDispatch } from '@/lib/redux/hooks';
import { jobsApiSlice } from '@/lib/redux/slices/jobsApiSlice';

interface JobInterviewsTabProps {
    job: JobApplication;
}

export function JobInterviewsTab({ job }: JobInterviewsTabProps) {
    const dispatch = useAppDispatch();

    const handleUpdate = () => {
        dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: job.id }]));
    };

    return (
        <div className="space-y-8">
            <JobInterviewsSection
                jobId={job.id}
                interviews={job.interviews}
                onUpdate={handleUpdate}
            />
            <div className="border-t pt-8">
                <JobNotesSection
                    jobId={job.id}
                    notes={job.notes}
                    onUpdate={handleUpdate}
                />
            </div>
        </div>
    );
}

'use client';

import { JobApplication } from '@/lib/types';
import { SimilarJobs } from '@/components/dashboard/SimilarJobs';
import { Link2 } from 'lucide-react';
import Image from 'next/image';

function StatusHistoryTimeline({ history }: { history: any[] }) {
    if (!history || history.length === 0) {
        return <p className="text-muted-foreground text-sm">No status history available.</p>;
    }
    return (
        <div className="relative pl-6 border-l-2 border-brand-accent-light">
            {history.map((item) => (
                <div key={item.id} className="relative mb-6 pl-3">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-brand-primary border-2 border-card"></div>
                    <p className="font-semibold text-foreground">{item.status.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(item.changedAt).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
}

interface JobDetailsTabProps {
    job: JobApplication;
}

export function JobDetailsTab({ job }: JobDetailsTabProps) {
    return (
        <div className="space-y-6">
            {job.url && (
                <div>
                    <h4 className="font-semibold mb-2 text-foreground">Job Listing</h4>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-primary hover:underline font-medium">
                        <Image src={`https://www.google.com/s2/favicons?domain=${new URL(job.url).hostname}&sz=32`} alt="favicon" width={16} height={16} className="rounded" />
                        <span>{new URL(job.url).hostname}</span>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                    </a>
                </div>
            )}

            <div>
                <h4 className="font-semibold mb-3 text-foreground">Job Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 border rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Platform</span>
                        <p className="font-medium mt-1">{job.platform?.name || 'Not specified'}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Status</span>
                        <p className="font-medium capitalize mt-1">{job.status?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Applied Date</span>
                        <p className="font-medium mt-1">{new Date(job.applicationDate).toLocaleDateString()}</p>
                    </div>
                    {job.interviewDate && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Interview Date</span>
                            <p className="font-medium mt-1">{new Date(job.interviewDate).toLocaleDateString()}</p>
                        </div>
                    )}
                    {job.deadline && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Deadline</span>
                            <p className="font-medium mt-1">{new Date(job.deadline).toLocaleDateString()}</p>
                        </div>
                    )}
                    {job.salary && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Salary</span>
                            <p className="font-medium text-brand-primary mt-1">{job.salary}</p>
                        </div>
                    )}
                </div>
            </div>

            {job.statusHistory && job.statusHistory.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-3 text-foreground">Status History</h4>
                    <StatusHistoryTimeline history={job.statusHistory} />
                </div>
            )}

            <SimilarJobs jobId={job.id} />
        </div>
    );
}

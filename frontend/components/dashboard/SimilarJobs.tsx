'use-client';

import { useFindSimilarJobsQuery } from "@/lib/redux/slices/jobsApiSlice";
import { Loader2, Telescope } from "lucide-react";
import { JobApplication } from "@/lib/types";

// A compact card to show similar job results
function SimilarJobCard({ job }: { job: JobApplication }) {
    return (
        <div className="p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-sm">{job.company}</p>
            <p className="text-xs text-muted-foreground">{job.position}</p>
        </div>
    )
}

export function SimilarJobs({ jobId }: { jobId: string }) {
    const { data: similarJobs, isLoading, error } = useFindSimilarJobsQuery(jobId);

    return (
        <div className="space-y-3">
            <h5 className="font-semibold text-foreground flex items-center">
                <Telescope className="mr-2 h-5 w-5 text-brand-primary"/>
                Similar Applications
            </h5>
            {isLoading && <Loader2 className="animate-spin" />}
            {error && <p className="text-sm text-destructive">Could not load similar jobs.</p>}
            {similarJobs && similarJobs.length === 0 && <p className="text-sm text-muted-foreground">No similar jobs found in your history.</p>}
            {similarJobs && (
                <div className="space-y-2">
                    {similarJobs.map(job => <SimilarJobCard key={job.id} job={job} />)}
                </div>
            )}
        </div>
    )
}
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeJobDetailsModal } from '@/lib/redux/slices/uiSlice';
import { Button } from '../ui/button';
import { BrainCircuit, Link2, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import { MatchAnalysis } from './MatchAnalysis';
import { AiCoach } from './AiCoach';
import { SimilarJobs } from "./SimilarJobs";

function StatusHistoryTimeline({ history }: { history: any[] }) {
    if (!history || history.length === 0) {
        return <p className="text-muted-foreground text-sm">No status history available.</p>;
    }
    return (
        <div className="relative pl-6 border-l-2 border-brand-accent-light">
            {history.map((item) => (
                <div key={item.id} className="relative mb-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-brand-primary border-2 border-card"></div>
                    <p className="font-semibold text-foreground">{item.status.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(item.changedAt).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
}

export function JobDetailsModal() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { isJobDetailsModalOpen, viewingJob } = useAppSelector(state => state.ui);
    const { data: session } = useSession();
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [updateJob] = useUpdateJobMutation();

    const { data: analysisData, isLoading: isAnalysisLoading, refetch } = useQuery({
        queryKey: ['aiAnalysis', viewingJob?.id],
        queryFn: async () => {
            if (!viewingJob?.id || !session?.accessToken) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/analyze/${viewingJob.id}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to fetch AI analysis.");
            }
            return res.json();
        },
        enabled: false,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const saveAnalysisMutation = useMutation({
        mutationFn: (analysis: string) => {
            if (!viewingJob) throw new Error("No job selected");
            return updateJob({ id: viewingJob.id, description: analysis }).unwrap();
        },
        onSuccess: () => {
            toast.success("AI summary saved as the new job description!");
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            dispatch(closeJobDetailsModal());
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save analysis.");
        }
    });

    const handleAnalyzeClick = () => {
        setShowAnalysis(true);
        toast.promise(refetch(), {
            loading: 'Generating AI insights...',
            success: 'Analysis complete!',
            error: (err: any) => err.message || 'Failed to generate analysis.'
        });
    };

    if (!viewingJob) return null;

    const handleClose = () => {
        setShowAnalysis(false);
        dispatch(closeJobDetailsModal());
    };

    return (
        <Dialog open={isJobDetailsModalOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{viewingJob.position}</DialogTitle>
                    <DialogDescription>{viewingJob.company} - {viewingJob.location}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {viewingJob.url && (
                        <div>
                             <h4 className="font-semibold mb-2 text-foreground">Job Listing</h4>
                             <a href={viewingJob.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-primary hover:underline font-medium">
                                 <img src={`https://www.google.com/s2/favicons?domain=${new URL(viewingJob.url).hostname}&sz=32`} alt="favicon" width={16} height={16} className="rounded" />
                                 <span>{new URL(viewingJob.url).hostname}</span>
                                 <Link2 className="h-4 w-4 text-muted-foreground"/>
                             </a>
                        </div>
                    )}
                    
                    {viewingJob.statusHistory && viewingJob.statusHistory.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3 text-foreground">Status History</h4>
                            <StatusHistoryTimeline history={viewingJob.statusHistory} />
                        </div>
                    )}

                    {session && viewingJob.description && <AiCoach jobId={viewingJob.id} />}

                    <div className="space-y-2 rounded-lg border bg-brand-accent-light/30 p-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-foreground">AI-Powered Insights</h4>
                            {!session ? (
                                <p className="text-xs text-muted-foreground">Login to use this feature</p>
                            ) : !showAnalysis && (
                                <Button size="sm" variant="outline" onClick={handleAnalyzeClick} className="bg-background">
                                    <BrainCircuit className="mr-2 h-4 w-4 text-brand-primary" /> Analyze
                                </Button>
                            )}
                        </div>
                        {showAnalysis && (
                             isAnalysisLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary"/> Generating analysis... this may take a moment.
                                </div>
                             ) : analysisData?.analysis ? (
                                <>
                                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{analysisData.analysis}</ReactMarkdown>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button size="sm" onClick={() => saveAnalysisMutation.mutate(analysisData.analysis)} disabled={saveAnalysisMutation.isPending}>
                                            <Save className="mr-2 h-4 w-4" /> Save as Description
                                        </Button>
                                    </div>
                                </>
                             ) : (
                                <p className="text-sm text-destructive">Could not generate analysis. Please try again later.</p>
                             )
                        )}
                    </div>
                    <SimilarJobs jobId={viewingJob.id} />
                    
                    {viewingJob.description && (
                         <div>
                            <h4 className="font-semibold mb-2 text-foreground">Full Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {viewingJob.description}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
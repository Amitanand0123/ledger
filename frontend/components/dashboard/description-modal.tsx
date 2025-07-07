'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeDescriptionModal } from '@/lib/redux/slices/uiSlice';
import { Button } from '../ui/button';
import { BrainCircuit, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import ReactMarkdown from 'react-markdown';

export function DescriptionModal() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { isDescriptionModalOpen, jobForDescriptionModal: job } = useAppSelector(state => state.ui);
    const { data: session } = useSession();
    
    const [summary, setSummary] = useState<string | null>(null);

    const [updateJob, { isLoading: isSaving }] = useUpdateJobMutation();

    const { data: analysisData, isFetching: isAnalysisLoading, refetch } = useQuery({
        queryKey: ['aiAnalysis', job?.id],
        queryFn: async () => {
            if (!job?.id || !session?.accessToken) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/analyze/${job.id}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to fetch AI analysis.");
            }
            const data = await res.json();
            setSummary(data.analysis); // Set the summary in state upon fetch
            return data;
        },
        enabled: false,
        retry: false,
    });

    const handleAnalyzeClick = () => {
        toast.promise(refetch(), {
            loading: 'Generating AI insights...',
            success: 'Analysis complete!',
            error: (err: any) => err.message || 'Failed to generate analysis.'
        });
    };

    const handleSaveSummary = () => {
        if (!job || !summary) return;
        toast.promise(updateJob({ id: job.id, description: summary }).unwrap(), {
            loading: 'Saving summary...',
            success: () => {
                handleClose();
                return 'Description updated with AI summary!';
            },
            error: 'Failed to save summary.'
        });
    };
    
    const handleClose = () => {
        setSummary(null); // Reset summary on close
        dispatch(closeDescriptionModal());
    };

    if (!job) return null;

    return (
        <Dialog open={isDescriptionModalOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Job Description</DialogTitle>
                    <DialogDescription>For {job.position} at {job.company}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className='rounded-md border bg-muted p-3'>
                        <h4 className='font-semibold mb-2'>Original Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {job.description || "No description provided."}
                        </p>
                    </div>

                    <div className="space-y-2 rounded-lg border bg-accent/50 p-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-foreground">AI Summary</h4>
                            <Button size="sm" variant="outline" onClick={handleAnalyzeClick} disabled={isAnalysisLoading} className="bg-background">
                                {isAnalysisLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4 text-primary" />}
                                 Summarize
                            </Button>
                        </div>
                        {isAnalysisLoading && <p className='text-sm text-muted-foreground'>Generating summary...</p>}
                        {summary && (
                             <div className="markdown-body prose prose-sm dark:prose-invert max-w-none rounded-md border bg-background p-3">
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                    <Button onClick={handleSaveSummary} disabled={isSaving || !summary}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Summary
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
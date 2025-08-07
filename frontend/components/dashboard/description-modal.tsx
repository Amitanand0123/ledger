// frontend/components/dashboard/description-modal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeDescriptionModal } from '@/lib/redux/slices/uiSlice';
import { Button } from '../ui/button';
import { BrainCircuit, Loader2, Save, FileText } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export function DescriptionModal() {
    const dispatch = useAppDispatch();
    const { isDescriptionModalOpen, jobForDescriptionModal: job } = useAppSelector(state => state.ui);
    const { data: session } = useSession();
    
    const [summary, setSummary] = useState<string | null>(null);
    const [updateJob, { isLoading: isSaving }] = useUpdateJobMutation();

    const { isFetching: isAnalysisLoading, refetch } = useQuery({
        queryKey: ['aiAnalysis', job?.id],
        queryFn: async () => {
            if (!job?.id || !session?.accessToken) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/analyze/${job.id}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch AI analysis.');
            const data = await res.json();
            setSummary(data.analysis);
            return data;
        },
        enabled: false, retry: false,
    });

    const handleAnalyzeClick = () => {
        toast.promise(refetch(), {
            loading: 'Generating AI summary...',
            success: 'Summary complete!',
            error: (err: any) => err.message || 'Failed to generate summary.',
        });
    };

    const handleSaveSummary = () => {
        if (!job || !summary) return;
        // FIX: Save the generated text to the `summary` field, not `description`
        toast.promise(updateJob({ id: job.id, summary: summary }).unwrap(), {
            loading: 'Saving summary...',
            success: () => { handleClose(); return 'Summary saved successfully!'; },
            error: 'Failed to save summary.',
        });
    };
    
    const handleClose = () => {
        setSummary(null);
        dispatch(closeDescriptionModal());
    };

    if (!job) return null;
    const currentSummary = summary || job.summary;

    return (
        <Dialog open={isDescriptionModalOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Job Description & Summary</DialogTitle>
                    <DialogDescription>For {job.position} at {job.company}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-2 rounded-lg border bg-accent/50 p-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-foreground">AI Summary</h4>
                            <Button size="sm" variant="outline" onClick={handleAnalyzeClick} disabled={isAnalysisLoading} className="bg-background">
                                {isAnalysisLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4 text-primary" />}
                                 {currentSummary ? 'Re-Summarize' : 'Summarize'}
                            </Button>
                        </div>
                        {isAnalysisLoading && <p className='text-sm text-muted-foreground'>Generating summary...</p>}
                        {currentSummary ? (
                             <div className="markdown-body prose prose-sm dark:prose-invert max-w-none rounded-md border bg-background p-3">
                                <ReactMarkdown>{currentSummary}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No summary generated yet.</p>
                        )}
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4"/> View Original Description
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='rounded-md border bg-muted p-3'>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {job.description || 'No original description was provided.'}
                            </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
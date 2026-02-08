'use client';

import { useState } from 'react';
import { JobApplication } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { jobsApiSlice } from '@/lib/redux/slices/jobsApiSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Save, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { AiCoach } from '@/components/dashboard/AiCoach';
import { MatchAnalysis } from '@/components/dashboard/MatchAnalysis';
import { AiResumeRebuilder } from '@/components/dashboard/AiResumeRebuilder';

interface JobAiToolsTabProps {
    job: JobApplication;
}

export function JobAiToolsTab({ job }: JobAiToolsTabProps) {
    const { data: session } = useSession();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [updateJob] = useUpdateJobMutation();

    const { data: analysisData, isLoading: isAnalysisLoading, refetch } = useQuery({
        queryKey: ['aiAnalysis', job.id],
        queryFn: async () => {
            if (!job.id || !session?.accessToken) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/analyze/${job.id}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch AI analysis.');
            }
            return res.json();
        },
        enabled: false,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const saveAnalysisMutation = useMutation({
        mutationFn: (analysis: string) => {
            return updateJob({ id: job.id, description: analysis }).unwrap();
        },
        onSuccess: () => {
            toast.success('AI summary saved as the new job description!');
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: job.id }]));
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save analysis.');
        },
    });

    const handleAnalyzeClick = () => {
        setShowAnalysis(true);
        toast.promise(refetch(), {
            loading: 'Generating AI insights...',
            success: 'Analysis complete!',
            error: (err: any) => err.message || 'Failed to generate analysis.',
        });
    };

    if (!session) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Login to access AI-powered features</p>
            </div>
        );
    }

    if (!job.description) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Add a job description to use AI tools</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-brand-accent-light/20 p-4">
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-brand-primary" />
                    Job Description Analysis
                </h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Get AI insights about this job description</p>
                        {!showAnalysis && (
                            <Button size="sm" variant="outline" onClick={handleAnalyzeClick} className="bg-background">
                                <BrainCircuit className="mr-2 h-4 w-4 text-brand-primary" /> Analyze
                            </Button>
                        )}
                    </div>
                    {showAnalysis && (
                        isAnalysisLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" /> Generating analysis...
                            </div>
                        ) : analysisData?.analysis ? (
                            <>
                                <div className="markdown-body prose prose-sm dark:prose-invert max-w-none bg-background rounded p-3">
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
            </div>

            <AiCoach jobId={job.id} />
            <MatchAnalysis jobId={job.id} />
            <AiResumeRebuilder jobId={job.id} />
        </div>
    );
}

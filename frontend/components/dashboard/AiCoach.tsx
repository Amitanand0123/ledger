// frontend/components/dashboard/AiCoach.tsx
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { useInvokeAgentMutation } from '@/lib/redux/slices/agentApiSlice';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../ui/label';

interface AiCoachProps {
    jobId: string;
}

export function AiCoach({ jobId }: AiCoachProps) {
    // --- STATE MANAGEMENT FIX ---
    // State to hold the ID of the currently selected resume from the dropdown.
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [userGoal, setUserGoal] = useState('Help me tailor my resume and prepare for this job.');
    
    const { data: resumes, isLoading: isLoadingResumes } = useGetDocumentsQuery('RESUME');
    const [invokeAgent, { data, isLoading: isThinking, error, reset }] = useInvokeAgentMutation();

    // --- UX IMPROVEMENT ---
    // If resumes have loaded and no resume is selected yet, automatically select the first one.
    useEffect(() => {
        if (resumes && resumes.length > 0 && !selectedResumeId) {
            setSelectedResumeId(resumes[0].id);
        }
    }, [resumes, selectedResumeId]);

    const handleGetAdvice = () => {
        // --- CLIENT-SIDE VALIDATION ---
        // Prevent API call if no resume is selected.
        if (!selectedResumeId) {
            toast.error('Please select a resume to analyze.');
            return;
        }
        // Clear previous results before making a new request
        reset();
        
        toast.promise(invokeAgent({ jobId, resumeId: selectedResumeId, userGoal }).unwrap(), {
            loading: 'Your AI Coach is analyzing your resume against the job description...',
            success: 'AI analysis complete!',
            error: (err) => err.data?.message || 'An unexpected error occurred.',
        });
    };

    return (
        <div className="space-y-4 rounded-lg border bg-purple-50 dark:bg-purple-950/50 p-4">
            <h4 className="font-semibold text-foreground flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-purple-500"/>
                AI Career Coach
            </h4>
            <div className="space-y-2">
                <Label htmlFor="user-goal">What is your goal?</Label>
                <Textarea id="user-goal" value={userGoal} onChange={(e) => setUserGoal(e.target.value)} placeholder="e.g., Help me prepare for the interview." />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Select 
                    value={selectedResumeId} 
                    onValueChange={setSelectedResumeId} 
                    disabled={isLoadingResumes || !resumes || resumes.length === 0}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingResumes ? 'Loading resumes...' : 'Select a resume'}/>
                    </SelectTrigger>
                    <SelectContent>
                        {!resumes || resumes.length === 0 ? (
                           <div className="p-4 text-center text-sm text-muted-foreground">No resumes uploaded.</div>
                        ) : (
                            resumes.map(resume => (
                                <SelectItem key={resume.id} value={resume.id}>{resume.filename}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button onClick={handleGetAdvice} disabled={!selectedResumeId || isThinking} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                    {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                     Get Advice
                </Button>
            </div>

            {isThinking && (
                <div className="text-center text-muted-foreground pt-4 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Your AI Coach is thinking...</span>
                </div>
            )}
            
            {error && <p className="text-destructive text-sm font-semibold text-center pt-2">{(error as any).data?.message || 'Failed to get advice.'}</p>}
            
            {data && (
                <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4 mt-4">
                    <ReactMarkdown>{data.recommendation}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
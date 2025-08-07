'use client';

import { useState } from 'react';
import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { useAnalyzeJobMatchMutation } from '@/lib/redux/slices/jobsApiSlice';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface MatchAnalysisProps {
    jobId: string;
}

export function MatchAnalysis({ jobId }: MatchAnalysisProps) {
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const { data: resumes, isLoading: isLoadingResumes } = useGetDocumentsQuery('RESUME');
    const [analyzeMatch, { data: analysis, isLoading: isAnalyzing, error }] = useAnalyzeJobMatchMutation();

    const handleAnalyze = () => {
        if (!selectedResumeId) {
            toast.error('Please select a resume to analyze.');
            return;
        }
        toast.promise(analyzeMatch({ jobId, resumeId: selectedResumeId }).unwrap(), {
            loading: 'Analyzing match with AI...',
            success: 'Analysis complete!',
            error: (err) => err.data?.message || 'Failed to get analysis.',
        });
    };

    return (
        <div className="space-y-4 rounded-lg border bg-brand-accent-light/30 p-4">
            <h4 className="font-semibold text-foreground">AI Resume Match</h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Select onValueChange={setSelectedResumeId} disabled={isLoadingResumes}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingResumes ? 'Loading resumes...' : 'Select a resume'}/>
                    </SelectTrigger>
                    <SelectContent>
                        {resumes?.map(resume => (
                            <SelectItem key={resume.id} value={resume.id}>{resume.filename}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleAnalyze} disabled={!selectedResumeId || isAnalyzing} className="w-full sm:w-auto">
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4 text-brand-primary" />}
                     Analyze Match
                </Button>
            </div>

            {isAnalyzing && <div className="text-center text-muted-foreground">Generating insights...</div>}
            
            {analysis && (
                <div className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-4xl font-bold text-brand-primary">{analysis.match_score}%</CardTitle>
                             <p className="text-center text-sm text-muted-foreground">Match Score</p>
                        </CardHeader>
                    </Card>

                    <div>
                        <h5 className="font-semibold mb-2">Matching Skills</h5>
                        <div className="flex flex-wrap gap-2">
                            {analysis.matching_skills.map((skill: string) => <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{skill}</Badge>)}
                        </div>
                    </div>
                     <div>
                        <h5 className="font-semibold mb-2">Missing Skills</h5>
                        <div className="flex flex-wrap gap-2">
                            {analysis.missing_skills.map((skill: string) => <Badge key={skill} variant="destructive">{skill}</Badge>)}
                        </div>
                    </div>
                     <div>
                        <h5 className="font-semibold mb-2">AI Suggestions</h5>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 border rounded-md bg-background">{analysis.suggestions}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
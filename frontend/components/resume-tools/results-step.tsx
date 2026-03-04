'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useScoreResumeMutation,
    useRebuildResumeStandaloneMutation,
} from '@/lib/redux/slices/resumeToolsApiSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Download,
    Loader2,
    RefreshCw,
    Sparkles,
    Target,
    Wand2,
} from 'lucide-react';
import type { WizardData } from './resume-tools-wizard';

interface Props {
    wizardData: WizardData;
    onBack: () => void;
    onReset: () => void;
}

export function ResultsStep({ wizardData, onBack, onReset }: Props) {
    const { data: session } = useSession();
    const [scoreResume, { data: scoreData, isLoading: isScoring }] = useScoreResumeMutation();
    const [rebuildResume, { data: rebuildData, isLoading: isRebuilding }] =
        useRebuildResumeStandaloneMutation();
    const [activeTab, setActiveTab] = useState('score');

    const handleScore = () => {
        toast.promise(
            scoreResume({
                resumeId: wizardData.selectedResumeId,
                jobDescription: wizardData.jobDescription,
            }).unwrap(),
            {
                loading: 'Analyzing your resume against the job description...',
                success: 'Resume score ready!',
                error: (err) => err.data?.message || 'Failed to score resume.',
            },
        );
    };

    const handleRebuild = () => {
        toast.promise(
            rebuildResume({
                resumeId: wizardData.selectedResumeId,
                jobDescription: wizardData.jobDescription,
            }).unwrap(),
            {
                loading: 'Generating your tailored resume... This may take a minute.',
                success: 'Tailored resume generated!',
                error: (err) => err.data?.message || 'Failed to generate tailored resume.',
            },
        );
    };

    const handleDownload = async () => {
        if (!rebuildData?.newDocument || !session?.accessToken) return;

        const toastId = toast.loading('Generating download link...');
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${rebuildData.newDocument.id}/download-url`,
                {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                },
            );
            if (!res.ok) throw new Error('Could not get download link.');
            const { url } = await res.json();
            window.open(url, '_blank');
            toast.success('Download started!', { id: toastId });
        } catch {
            toast.error('Failed to generate download link.', { id: toastId });
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'from-green-500/20 to-emerald-500/20';
        if (score >= 60) return 'from-yellow-500/20 to-amber-500/20';
        return 'from-red-500/20 to-orange-500/20';
    };

    return (
        <div className="space-y-6">
            {/* Job Summary */}
            <Card className="border-dashed">
                <CardContent className="flex items-center gap-4 py-4">
                    <Target className="h-5 w-5 shrink-0 text-brand-primary" />
                    <div className="min-w-0">
                        <p className="font-medium text-foreground">
                            {wizardData.position || 'Job Position'}
                            {wizardData.company && (
                                <span className="text-muted-foreground"> at {wizardData.company}</span>
                            )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {wizardData.jobDescription.slice(0, 120)}...
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="score">Resume Score</TabsTrigger>
                    <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
                </TabsList>

                {/* Score Tab */}
                <TabsContent value="score" className="mt-6">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            {!scoreData && !isScoring && (
                                <div className="flex flex-col items-center gap-4 py-8 text-center">
                                    <Sparkles className="h-12 w-12 text-brand-primary/50" />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Ready to analyze your resume
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            AI will compare your resume against the job description and
                                            provide a detailed match score.
                                        </p>
                                    </div>
                                    <Button onClick={handleScore} size="lg">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Score My Resume
                                    </Button>
                                </div>
                            )}

                            {isScoring && (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                                    <p className="text-sm text-muted-foreground">
                                        Analyzing your resume...
                                    </p>
                                </div>
                            )}

                            {scoreData && (
                                <div className="space-y-6">
                                    {/* Score Display */}
                                    <div
                                        className={`rounded-xl bg-gradient-to-br ${getScoreBgColor(scoreData.match_score)} p-8 text-center`}
                                    >
                                        <p
                                            className={`text-6xl font-bold ${getScoreColor(scoreData.match_score)}`}
                                        >
                                            {scoreData.match_score}%
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            ATS Match Score
                                        </p>
                                    </div>

                                    {/* Matching Skills */}
                                    {scoreData.matching_skills.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 font-semibold text-foreground">
                                                Matching Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {scoreData.matching_skills.map((skill) => (
                                                    <Badge
                                                        key={skill}
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Missing Skills */}
                                    {scoreData.missing_skills.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 font-semibold text-foreground">
                                                Missing Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {scoreData.missing_skills.map((skill) => (
                                                    <Badge key={skill} variant="destructive">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {scoreData.suggestions && (
                                        <div>
                                            <h4 className="mb-2 font-semibold text-foreground">
                                                AI Suggestions
                                            </h4>
                                            <p className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm text-muted-foreground">
                                                {scoreData.suggestions}
                                            </p>
                                        </div>
                                    )}

                                    {/* Re-score button */}
                                    <div className="text-center">
                                        <Button variant="outline" size="sm" onClick={handleScore}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Re-analyze
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tailored Resume Tab */}
                <TabsContent value="tailored" className="mt-6">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            {!wizardData.selectedResumeHasLatex ? (
                                <div className="flex flex-col items-center gap-4 py-8 text-center">
                                    <Wand2 className="h-12 w-12 text-muted-foreground/50" />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            LaTeX source required
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            To generate a tailored resume, upload a resume with LaTeX
                                            source code in{' '}
                                            <a
                                                href="/settings"
                                                className="text-brand-primary underline"
                                            >
                                                Settings
                                            </a>
                                            . Your current resume can still be used for scoring.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {!rebuildData && !isRebuilding && (
                                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                                            <Wand2 className="h-12 w-12 text-blue-500/50" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Generate a tailored resume
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    AI will modify your resume&apos;s LaTeX source to
                                                    better match this job description, then compile it
                                                    to PDF.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleRebuild}
                                                size="lg"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                Generate Tailored Resume
                                            </Button>
                                        </div>
                                    )}

                                    {isRebuilding && (
                                        <div className="flex flex-col items-center gap-3 py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                            <p className="text-sm text-muted-foreground">
                                                Rebuilding your resume... This may take up to a minute.
                                            </p>
                                        </div>
                                    )}

                                    {rebuildData && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between rounded-lg bg-green-100 p-4 dark:bg-green-900/50">
                                                <div>
                                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                                        {rebuildData.newDocument.filename}
                                                    </p>
                                                    <p className="text-sm text-green-600 dark:text-green-400">
                                                        {rebuildData.message}
                                                    </p>
                                                </div>
                                                <Button variant="outline" onClick={handleDownload}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </Button>
                                            </div>
                                            <div className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRebuild}
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Regenerate
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button variant="ghost" onClick={onReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Over
                </Button>
            </div>
        </div>
    );
}

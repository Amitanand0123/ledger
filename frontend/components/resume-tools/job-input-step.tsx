'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExtractJobFromUrlMutation } from '@/lib/redux/slices/resumeToolsApiSlice';
import { toast } from 'sonner';
import { ArrowRight, Globe, Keyboard, Loader2, Sparkles } from 'lucide-react';
import type { WizardData } from './resume-tools-wizard';

interface Props {
    wizardData: WizardData;
    setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
    onNext: () => void;
}

export function JobInputStep({ wizardData, setWizardData, onNext }: Props) {
    const [mode, setMode] = useState<'url' | 'manual'>('manual');
    const [url, setUrl] = useState('');
    const [extractJobFromUrl, { isLoading: isExtracting }] = useExtractJobFromUrlMutation();

    const handleExtract = async () => {
        if (!url.trim()) {
            toast.error('Please enter a URL.');
            return;
        }

        try {
            const result = await extractJobFromUrl({ url: url.trim() }).unwrap();
            setWizardData((prev) => ({
                ...prev,
                position: result.position || prev.position,
                company: result.company || prev.company,
                location: result.location || prev.location,
                jobDescription: result.description || prev.jobDescription,
            }));
            toast.success('Job details extracted successfully!');
        } catch (err: any) {
            toast.error(err.data?.message || 'Failed to extract job details from URL.');
        }
    };

    const handleNext = () => {
        if (!wizardData.jobDescription.trim()) {
            toast.error('Please provide a job description.');
            return;
        }
        onNext();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Provide the job description by pasting a URL or entering it manually.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('url')}
                        className="flex-1"
                    >
                        <Globe className="mr-2 h-4 w-4" />
                        Paste Job URL
                    </Button>
                    <Button
                        variant={mode === 'manual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('manual')}
                        className="flex-1"
                    >
                        <Keyboard className="mr-2 h-4 w-4" />
                        Enter Manually
                    </Button>
                </div>

                {/* URL Mode */}
                {mode === 'url' && (
                    <div className="space-y-3">
                        <Label htmlFor="job-url">Job Posting URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="job-url"
                                type="url"
                                placeholder="https://linkedin.com/jobs/view/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={isExtracting}
                            />
                            <Button onClick={handleExtract} disabled={isExtracting || !url.trim()}>
                                {isExtracting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Extract
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            AI will extract job details from the URL. Works best with public job postings.
                        </p>
                    </div>
                )}

                {/* Position & Company (shown in both modes, editable) */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            placeholder="e.g. Senior Frontend Developer"
                            value={wizardData.position}
                            onChange={(e) => setWizardData((prev) => ({ ...prev, position: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input
                            id="company"
                            placeholder="e.g. Acme Corp"
                            value={wizardData.company}
                            onChange={(e) => setWizardData((prev) => ({ ...prev, company: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                    <Label htmlFor="job-description">
                        Job Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="job-description"
                        placeholder="Paste the full job description here..."
                        value={wizardData.jobDescription}
                        onChange={(e) => setWizardData((prev) => ({ ...prev, jobDescription: e.target.value }))}
                        rows={10}
                        className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                        Include responsibilities, requirements, and qualifications for the best results.
                    </p>
                </div>

                {/* Next Button */}
                <div className="flex justify-end">
                    <Button onClick={handleNext} disabled={!wizardData.jobDescription.trim()}>
                        Next: Select Resume
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

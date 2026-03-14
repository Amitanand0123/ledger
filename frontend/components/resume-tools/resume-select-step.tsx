'use client';

import { useGetDocumentsQuery } from '@/lib/redux/slices/documentApiSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, FileText, Loader2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { WizardData } from './resume-tools-wizard';
import type { UserDocument } from '@/lib/types';

interface Props {
    wizardData: WizardData;
    setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
    onNext: () => void;
    onBack: () => void;
}

export function ResumeSelectStep({ wizardData, setWizardData, onNext, onBack }: Props) {
    const { data: resumes, isLoading } = useGetDocumentsQuery('RESUME');

    const handleSelect = (resumeId: string) => {
        const resume = resumes?.find((r: UserDocument) => r.id === resumeId);
        const hasLatex = !!(resume?.latexSource && resume.latexSource.trim());
        setWizardData((prev) => ({
            ...prev,
            selectedResumeId: resumeId,
            selectedResumeHasLatex: hasLatex,
        }));
    };

    const handleNext = () => {
        if (!wizardData.selectedResumeId) {
            toast.error('Please select a resume.');
            return;
        }
        onNext();
    };

    const selectedResume = resumes?.find((r: UserDocument) => r.id === wizardData.selectedResumeId);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Resume</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Choose the resume you want to score or tailor for this job.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading resumes...</span>
                    </div>
                ) : !resumes || resumes.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                            <p className="font-medium text-foreground">No resumes uploaded</p>
                            <p className="text-sm text-muted-foreground">
                                Upload a resume in Settings to use this feature.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/settings">
                                <Upload className="mr-2 h-4 w-4" />
                                Go to Settings
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Select
                                value={wizardData.selectedResumeId}
                                onValueChange={handleSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a resume..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resumes.map((resume: UserDocument) => (
                                        <SelectItem key={resume.id} value={resume.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{resume.filename}</span>
                                                {resume.latexSource && resume.latexSource.trim() && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        LaTeX
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedResume && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-brand-primary" />
                                    <div>
                                        <p className="font-medium">{selectedResume.filename}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded {formatDate(selectedResume.createdAt)}
                                        </p>
                                        {wizardData.selectedResumeHasLatex ? (
                                            <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                LaTeX source available — tailored resume generation enabled
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="mt-1">
                                                No LaTeX source — scoring only (tailored resume requires LaTeX)
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!wizardData.selectedResumeId}
                    >
                        Next: View Results
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

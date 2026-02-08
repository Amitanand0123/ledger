'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { CheckCircle2, Circle, Sparkles, FileText, Target, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AiCoach } from './AiCoach';
import { MatchAnalysis } from './MatchAnalysis';
import { AiResumeRebuilder } from './AiResumeRebuilder';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';

interface ApplicationPreparationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobPosition: string;
    jobCompany: string;
}

type WizardStep = {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    completed: boolean;
};

export function ApplicationPreparationWizard({
    isOpen,
    onClose,
    jobId,
    jobPosition,
    jobCompany,
}: ApplicationPreparationWizardProps) {
    const { data: session } = useSession();
    const [updateJob] = useUpdateJobMutation();
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const steps: WizardStep[] = [
        {
            id: 0,
            title: 'Get Started',
            description: 'Optimize your application before applying',
            icon: <Target className="h-5 w-5" />,
            completed: completedSteps.includes(0),
        },
        {
            id: 1,
            title: 'AI Career Coach',
            description: 'Get personalized resume advice',
            icon: <Sparkles className="h-5 w-5" />,
            completed: completedSteps.includes(1),
        },
        {
            id: 2,
            title: 'Match Analysis',
            description: 'Check your resume compatibility',
            icon: <Target className="h-5 w-5" />,
            completed: completedSteps.includes(2),
        },
        {
            id: 3,
            title: 'Resume Rebuilder',
            description: 'Generate optimized resume',
            icon: <FileText className="h-5 w-5" />,
            completed: completedSteps.includes(3),
        },
        {
            id: 4,
            title: 'Ready to Apply',
            description: 'Download and submit your application',
            icon: <Download className="h-5 w-5" />,
            completed: completedSteps.includes(4),
        },
    ];

    const progress = (completedSteps.length / steps.length) * 100;

    const markStepComplete = (stepId: number) => {
        setCompletedSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
    };

    const handleMarkReadyToApply = async () => {
        try {
            await updateJob({ id: jobId, status: 'READY_TO_APPLY' }).unwrap();
            toast.success('Job marked as ready to apply!');
            onClose();
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to update job status');
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            markStepComplete(currentStep);
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    if (!session) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] w-[92vw] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Prepare Your Application
                    </DialogTitle>
                    <DialogDescription>
                        {jobPosition} at {jobCompany}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{completedSteps.length} of {steps.length} steps completed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-between px-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => setCurrentStep(index)}
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                    step.completed
                                        ? 'bg-brand-primary border-brand-primary text-white'
                                        : currentStep === index
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </button>
                            <span className={`text-xs text-center max-w-[80px] ${
                                currentStep === index ? 'font-medium' : 'text-muted-foreground'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto px-1 py-4 min-h-[400px]">
                    {currentStep === 0 && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-accent-light/30">
                                <Target className="h-10 w-10 text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Let&apos;s Optimize Your Application!</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Before you apply, use our AI-powered tools to maximize your chances of success.
                                    We&apos;ll help you tailor your resume, identify skill gaps, and prepare optimized materials.
                                </p>
                            </div>
                            <div className="bg-brand-accent-light/20 rounded-lg p-6 max-w-lg mx-auto text-left">
                                <h4 className="font-semibold mb-3">What you&apos;ll do:</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                                        <span>Get AI-powered career coaching tailored to this job</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                                        <span>Analyze how well your resume matches the job requirements</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                                        <span>Generate an optimized version of your resume (LaTeX required)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                                        <span>Download your materials and apply with confidence</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">Get Personalized Career Advice</h3>
                                <p className="text-muted-foreground">
                                    Our AI coach will analyze your resume and provide tailored recommendations
                                </p>
                            </div>
                            <AiCoach jobId={jobId} />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">Check Your Resume Match</h3>
                                <p className="text-muted-foreground">
                                    See how well your resume aligns with this job&apos;s requirements
                                </p>
                            </div>
                            <MatchAnalysis jobId={jobId} />
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">Generate Optimized Resume</h3>
                                <p className="text-muted-foreground">
                                    Let AI rebuild your resume specifically for this job (requires LaTeX source)
                                </p>
                            </div>
                            <AiResumeRebuilder jobId={jobId} />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">You&apos;re Ready to Apply!</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    You&apos;ve completed all the preparation steps. Your application materials are optimized and ready to submit.
                                </p>
                            </div>
                            <div className="bg-brand-accent-light/20 rounded-lg p-6 max-w-lg mx-auto">
                                <h4 className="font-semibold mb-3">Next Steps:</h4>
                                <ol className="space-y-3 text-sm text-left">
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                                            1
                                        </span>
                                        <span>Download your optimized resume from the Documents tab</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                                            2
                                        </span>
                                        <span>Visit the job listing and submit your application</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                                            3
                                        </span>
                                        <span>Return here and update the job status to &quot;APPLIED&quot;</span>
                                    </li>
                                </ol>
                            </div>
                            <Button size="lg" onClick={handleMarkReadyToApply} className="mt-4">
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Mark as Ready to Apply
                            </Button>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex gap-2">
                        {currentStep > 0 && currentStep < steps.length - 1 && (
                            <Button variant="ghost" onClick={handleSkip}>
                                Skip
                            </Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button onClick={handleNext}>
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {currentStep === steps.length - 1 && (
                            <Button onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState } from 'react';
import { JobInputStep } from './job-input-step';
import { ResumeSelectStep } from './resume-select-step';
import { ResultsStep } from './results-step';
import { Check, FileText, Upload, Trophy } from 'lucide-react';

export interface WizardData {
    position: string;
    company: string;
    location: string;
    jobDescription: string;
    selectedResumeId: string;
    selectedResumeHasLatex: boolean;
}

const STEPS = [
    { label: 'Job Details', description: 'Provide the job description', icon: FileText },
    { label: 'Resume', description: 'Select your resume', icon: Upload },
    { label: 'Results', description: 'View score & suggestions', icon: Trophy },
];

export function ResumeToolsWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [wizardData, setWizardData] = useState<WizardData>({
        position: '',
        company: '',
        location: '',
        jobDescription: '',
        selectedResumeId: '',
        selectedResumeHasLatex: false,
    });

    const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));
    const resetWizard = () => {
        setCurrentStep(0);
        setWizardData({
            position: '',
            company: '',
            location: '',
            jobDescription: '',
            selectedResumeId: '',
            selectedResumeHasLatex: false,
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Panel — Title + Vertical Stepper */}
            <div className="lg:w-[280px] shrink-0">
                <div className="lg:sticky lg:top-8">
                    <h1 className="text-3xl font-bold text-foreground">Resume Tools</h1>
                    <p className="mt-2 text-muted-foreground text-sm">
                        Score your resume against a job description or generate a tailored resume.
                    </p>

                    {/* Mobile: horizontal stepper */}
                    <div className="flex items-center justify-center gap-2 mt-6 lg:hidden">
                        {STEPS.map((step, index) => (
                            <div key={step.label} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                                            index < currentStep
                                                ? 'border-brand-primary bg-brand-primary text-white'
                                                : index === currentStep
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                                  : 'border-muted-foreground/30 text-muted-foreground/50'
                                        }`}
                                    >
                                        {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                                    </div>
                                    <span
                                        className={`mt-1 text-xs ${
                                            index <= currentStep ? 'font-medium text-foreground' : 'text-muted-foreground/50'
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`mx-3 mb-5 h-0.5 w-16 transition-colors ${
                                            index < currentStep ? 'bg-brand-primary' : 'bg-muted-foreground/20'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop: vertical stepper */}
                    <div className="hidden lg:flex flex-col mt-8 space-y-0">
                        {STEPS.map((step, index) => (
                            <div key={step.label} className="flex items-start">
                                {/* Circle + connector line */}
                                <div className="flex flex-col items-center mr-4">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                                            index < currentStep
                                                ? 'border-brand-primary bg-brand-primary text-white'
                                                : index === currentStep
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                                  : 'border-muted-foreground/30 text-muted-foreground/50'
                                        }`}
                                    >
                                        {index < currentStep ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={`w-0.5 h-10 transition-colors ${
                                                index < currentStep ? 'bg-brand-primary' : 'bg-muted-foreground/20'
                                            }`}
                                        />
                                    )}
                                </div>
                                {/* Label + description */}
                                <div className="pt-2">
                                    <p
                                        className={`text-sm font-semibold ${
                                            index <= currentStep ? 'text-foreground' : 'text-muted-foreground/50'
                                        }`}
                                    >
                                        {step.label}
                                    </p>
                                    <p
                                        className={`text-xs ${
                                            index <= currentStep ? 'text-muted-foreground' : 'text-muted-foreground/30'
                                        }`}
                                    >
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Step Content */}
            <div className="flex-1 min-w-0">
                {currentStep === 0 && (
                    <JobInputStep
                        wizardData={wizardData}
                        setWizardData={setWizardData}
                        onNext={goNext}
                    />
                )}
                {currentStep === 1 && (
                    <ResumeSelectStep
                        wizardData={wizardData}
                        setWizardData={setWizardData}
                        onNext={goNext}
                        onBack={goBack}
                    />
                )}
                {currentStep === 2 && (
                    <ResultsStep
                        wizardData={wizardData}
                        onBack={goBack}
                        onReset={resetWizard}
                    />
                )}
            </div>
        </div>
    );
}

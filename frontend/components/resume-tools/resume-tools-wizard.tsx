'use client';

import { useState } from 'react';
import { JobInputStep } from './job-input-step';
import { ResumeSelectStep } from './resume-select-step';
import { ResultsStep } from './results-step';
import { Check } from 'lucide-react';

export interface WizardData {
    position: string;
    company: string;
    location: string;
    jobDescription: string;
    selectedResumeId: string;
    selectedResumeHasLatex: boolean;
}

const STEPS = ['Job Details', 'Resume', 'Results'];

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
        <div className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2">
                {STEPS.map((label, index) => (
                    <div key={label} className="flex items-center">
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
                                {label}
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

            {/* Step Content */}
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
    );
}

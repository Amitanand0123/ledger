'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useCompleteOnboardingMutation } from '@/lib/redux/slices/userApiSlice';
import { useCreateDocumentMutation } from '@/lib/redux/slices/documentApiSlice';
import { toast } from 'sonner';
import { useSession, getSession } from 'next-auth/react';

interface FileWithType {
    file: File;
    type: 'RESUME' | 'COVER_LETTER';
}

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: session } = useSession();
    const [selectedFiles, setSelectedFiles] = useState<FileWithType[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [completeOnboarding] = useCompleteOnboardingMutation();
    const [createDocument] = useCreateDocumentMutation();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'RESUME' | 'COVER_LETTER') => {
        const files = Array.from(event.target.files || []);
        const newFiles = files.map(file => ({ file, type }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadToS3 = async (file: File, presignedUrl: string) => {
        console.log('[Onboarding Upload] Uploading to S3, URL prefix:', presignedUrl?.substring(0, 80));
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Onboarding Upload] S3 failed:', response.status, errorText);
            throw new Error('Failed to upload file to S3');
        }
        console.log('[Onboarding Upload] S3 upload success');
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select at least one file to upload');
            return;
        }

        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            // Get fresh session to ensure we have a valid token
            const currentSession = await getSession();

            if (!currentSession?.accessToken) {
                toast.error('Session expired. Please log in again.');
                setIsUploading(false);
                return;
            }

            for (const { file, type } of selectedFiles) {
                try {
                    // Get presigned URL
                    const presignedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/uploads/presigned-url`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${currentSession.accessToken}`,
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            contentType: file.type,
                        }),
                    });

                    if (!presignedResponse.ok) {
                        throw new Error('Failed to get upload URL');
                    }

                    const presignedData = await presignedResponse.json();
                    const { signedUrl, key } = presignedData.data || presignedData;

                    // Upload to S3
                    await uploadToS3(file, signedUrl);

                    // Create document record
                    await createDocument({
                        filename: file.name,
                        fileKey: key,
                        type,
                    }).unwrap();

                    successCount++;
                } catch (error: any) {
                    failCount++;
                }
            }

            // Complete onboarding
            await completeOnboarding().unwrap();

            if (failCount === 0) {
                toast.success(`Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}!`);
            } else {
                toast.warning(`Uploaded ${successCount} document${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
            }

            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to complete onboarding. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await completeOnboarding().unwrap();
            toast.info('Onboarding skipped. You can upload documents later in Settings.');
            onClose();
        } catch (error) {
            toast.error('Failed to skip onboarding. Please try again.');
        }
    };

    // Don't render if session is not available
    if (!session?.accessToken) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isUploading && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] w-[92vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <FileText className="h-6 w-6 text-brand-primary" />
                        Welcome! Let&apos;s Get Started
                    </DialogTitle>
                    <DialogDescription>
                        Upload your resume(s) and cover letter(s) to get personalized AI suggestions for your job applications.
                        You can always add more later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Resume Upload Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Resumes</h3>
                            <label htmlFor="resume-upload">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    className="min-w-[160px]"
                                    onClick={() => document.getElementById('resume-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Add Resume
                                </Button>
                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e, 'RESUME')}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        {/* Display selected resumes */}
                        <div className="space-y-2">
                            {selectedFiles.filter(f => f.type === 'RESUME').map((fileObj, index) => (
                                <div
                                    key={`resume-${index}`}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-4 w-4 text-brand-primary flex-shrink-0" />
                                        <span className="text-sm truncate">{fileObj.file.name}</span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            ({(fileObj.file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(selectedFiles.indexOf(fileObj))}
                                        disabled={isUploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cover Letter Upload Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Cover Letters</h3>
                            <label htmlFor="coverletter-upload">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    className="min-w-[160px]"
                                    onClick={() => document.getElementById('coverletter-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Add Cover Letter
                                </Button>
                                <input
                                    id="coverletter-upload"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e, 'COVER_LETTER')}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        {/* Display selected cover letters */}
                        <div className="space-y-2">
                            {selectedFiles.filter(f => f.type === 'COVER_LETTER').map((fileObj, index) => (
                                <div
                                    key={`coverletter-${index}`}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-4 w-4 text-brand-primary flex-shrink-0" />
                                        <span className="text-sm truncate">{fileObj.file.name}</span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            ({(fileObj.file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(selectedFiles.indexOf(fileObj))}
                                        disabled={isUploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedFiles.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No files selected. Upload documents or skip to continue.
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isUploading}
                        className="flex-1"
                    >
                        Skip for Now
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || selectedFiles.length === 0}
                        className="flex-1"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Upload & Continue
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState } from 'react';
import { JobApplication } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobDocumentsTabProps {
    job: JobApplication;
}

export function JobDocumentsTab({ job }: JobDocumentsTabProps) {
    const { data: session } = useSession();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownloadDocument = async (documentId: string, filename: string) => {
        if (!session?.accessToken) {
            toast.error('Please log in to download documents.');
            return;
        }

        setDownloadingId(documentId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${documentId}/download-url`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get download URL');
            }

            const result = await response.json();
            const { url } = result.data;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Downloading "${filename}"`);
        } catch (error: any) {
            console.error('Download error:', error);
            toast.error(error.message || 'Failed to download document.');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div>
            <h4 className="font-semibold mb-4 text-foreground">Attached Documents</h4>
            <div className="space-y-3">
                {job.resume ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-brand-primary" />
                            <div>
                                <p className="font-medium text-sm">Resume</p>
                                <p className="text-xs text-muted-foreground">{job.resume.filename}</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(job.resume!.id, job.resume!.filename)}
                            disabled={downloadingId === job.resume.id}
                        >
                            {downloadingId === job.resume.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">No resume attached</p>
                    </div>
                )}

                {job.coverLetter ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-brand-primary" />
                            <div>
                                <p className="font-medium text-sm">Cover Letter</p>
                                <p className="text-xs text-muted-foreground">{job.coverLetter.filename}</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(job.coverLetter!.id, job.coverLetter!.filename)}
                            disabled={downloadingId === job.coverLetter.id}
                        >
                            {downloadingId === job.coverLetter.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">No cover letter attached</p>
                    </div>
                )}
            </div>
        </div>
    );
}

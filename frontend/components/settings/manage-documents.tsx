'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetDocumentsQuery, useDeleteDocumentMutation, documentApiSlice } from '@/lib/redux/slices/documentApiSlice';
import { Loader2, PlusCircle, Trash2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Input } from '../ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/redux/hooks';
import { DocumentUploader } from './DocumentUploader';


export function ManageDocuments() {
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const { data: documents, isLoading } = useGetDocumentsQuery(undefined);
    const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const [showResumeUploader, setShowResumeUploader] = useState(false);
    const [showCoverLetterUploader, setShowCoverLetterUploader] = useState(false);

    const handleDownload = async (id: string, filename: string) => {
        if (!session?.accessToken) {
            toast.error('Please log in to download documents.');
            return;
        }

        setDownloadingId(id);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${id}/download-url`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get download URL');
            }

            const result = await response.json();
            const { url } = result.data;

            // Trigger download using a temporary anchor element
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

    const handleDelete = (id: string, name: string) => {
        toast.warning(`Are you sure you want to delete "${name}"? This cannot be undone.`, {
            action: { label: 'Delete', onClick: () => {
                toast.promise(deleteDocument(id).unwrap(), {
                    loading: 'Deleting document...',
                    success: `Document "${name}" deleted.`,
                    error: (err) => err.data?.message || 'Failed to delete document.',
                });
            }},
            duration: 10000,
        });
    };
    
    const onUploadComplete = () => {
        setShowResumeUploader(false);
        setShowCoverLetterUploader(false);
        dispatch(documentApiSlice.util.invalidateTags(['Document']));
    };

    const resumes = documents?.filter(d => d.type === 'RESUME') || [];
    const coverLetters = documents?.filter(d => d.type === 'COVER_LETTER') || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>
                    Manage your resumes and cover letters. Provide LaTeX source for resumes to enable the AI Rebuilder.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? <div className="flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div> : (
                    <>
                        {/* Resumes Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Resumes ({resumes.length})</h4>
                                <Button size="sm" variant="outline" onClick={() => setShowResumeUploader(s => !s)}>
                                    <PlusCircle className="mr-2 h-4 w-4"/>Add Resume
                                </Button>
                            </div>
                            {showResumeUploader && <DocumentUploader type="RESUME" onUploadComplete={onUploadComplete}/>}
                            <div className="mt-2 space-y-2">
                                {resumes.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground"/>
                                            <div>
                                                <p className="font-medium">{doc.filename}</p>
                                                {doc.latexSource && <p className="text-xs text-green-600 font-semibold">LaTeX Source Attached</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownload(doc.id, doc.filename)}
                                                disabled={downloadingId === doc.id}
                                                title="Download document"
                                            >
                                                {downloadingId === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                                                ) : (
                                                    <Download className="h-4 w-4 text-brand-primary hover:text-brand-secondary" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(doc.id, doc.filename)}
                                                disabled={isDeleting}
                                                title="Delete document"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive hover:text-red-700" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {resumes.length === 0 && !showResumeUploader && <p className="text-sm text-muted-foreground text-center py-4">No resumes uploaded yet.</p>}
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Cover Letters Section */}
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Cover Letters ({coverLetters.length})</h4>
                                <Button size="sm" variant="outline" onClick={() => setShowCoverLetterUploader(s => !s)}>
                                    <PlusCircle className="mr-2 h-4 w-4"/>Add Cover Letter
                                </Button>
                            </div>
                            {showCoverLetterUploader && <DocumentUploader type="COVER_LETTER" onUploadComplete={onUploadComplete} />}
                             <div className="mt-2 space-y-2">
                                {coverLetters.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground"/>
                                            <p className="font-medium">{doc.filename}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownload(doc.id, doc.filename)}
                                                disabled={downloadingId === doc.id}
                                                title="Download document"
                                            >
                                                {downloadingId === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                                                ) : (
                                                    <Download className="h-4 w-4 text-brand-primary hover:text-brand-secondary" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(doc.id, doc.filename)}
                                                disabled={isDeleting}
                                                title="Delete document"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive hover:text-red-700" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {coverLetters.length === 0 && !showCoverLetterUploader && <p className="text-sm text-muted-foreground text-center py-4">No cover letters uploaded yet.</p>}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
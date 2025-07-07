'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDocumentsQuery, useDeleteDocumentMutation, documentApiSlice } from "@/lib/redux/slices/documentApiSlice";
import { Loader2, PlusCircle, Trash2, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Input } from "../ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/lib/redux/hooks";

interface DocumentUploaderProps {
    type: 'RESUME' | 'COVER_LETTER';
    onUploadComplete: () => void;
}

function DocumentUploader({ type, onUploadComplete }: DocumentUploaderProps) {
    const { data: session } = useSession();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !session) return;
        setIsUploading(true);

        const uploadPromise = new Promise(async (resolve, reject) => {
            try {
                // 1. Get presigned URL
                const presignedUrlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/uploads/presigned-url`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${session.accessToken}` 
                    },
                    body: JSON.stringify({ 
                        filename: selectedFile.name, 
                        contentType: selectedFile.type 
                    })
                });
                
                if (!presignedUrlRes.ok) {
                    const errorText = await presignedUrlRes.text();
                    return reject(new Error(`Could not get an upload URL: ${errorText}`));
                }
                
                const { signedUrl, key } = await presignedUrlRes.json();

                // 2. Upload to S3 with proper headers
                const s3UploadRes = await fetch(signedUrl, { 
                    method: 'PUT', 
                    body: selectedFile,
                    headers: { 
                        'Content-Type': selectedFile.type,
                        // Remove any other headers that might interfere
                    },
                    mode: 'cors' // Explicitly set CORS mode
                });
                
                if (!s3UploadRes.ok) {
                    const errorText = await s3UploadRes.text();
                    return reject(new Error(`File upload to S3 failed: ${s3UploadRes.status} ${errorText}`));
                }

                // 3. Create document record in our DB
                const docCreateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${session.accessToken}` 
                    },
                    body: JSON.stringify({ 
                        filename: selectedFile.name, 
                        fileKey: key, 
                        type 
                    })
                });
                
                if (!docCreateRes.ok) {
                    const errorText = await docCreateRes.text();
                    return reject(new Error(`Failed to save document record: ${errorText}`));
                }
                
                resolve(`File "${selectedFile.name}" uploaded successfully!`);

            } catch (error) {
                console.error('Upload error:', error);
                reject(error);
            }
        });

        try {
            await toast.promise(uploadPromise, {
                loading: "Uploading file...",
                success: (message) => `${message}`,
                error: (err) => `${err.message || "Upload failed."}`
            });
            
            onUploadComplete();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <Input 
                type="file" 
                onChange={handleFileChange} 
                className="flex-1" 
                disabled={isUploading}
                accept=".pdf,.doc,.docx" 
            />
            <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading} 
                size="icon" 
                variant="secondary"
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            </Button>
        </div>
    );
}


export function ManageDocuments() {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const { data: documents, isLoading } = useGetDocumentsQuery(undefined);
    const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
    const [showResumeUploader, setShowResumeUploader] = useState(false);
    const [showCoverLetterUploader, setShowCoverLetterUploader] = useState(false);

    const handleDelete = (id: string, name: string) => {
        toast.warning(`Delete "${name}"? This cannot be undone.`, {
            action: {
                label: 'Delete',
                onClick: () => {
                     toast.promise(deleteDocument(id).unwrap(), {
                        loading: 'Deleting document...',
                        success: `Document "${name}" deleted.`,
                        error: 'Failed to delete document.'
                    });
                }
            }
        })
    };
    
    const onUploadComplete = () => {
        setShowResumeUploader(false);
        setShowCoverLetterUploader(false);
        dispatch(documentApiSlice.util.invalidateTags(['Document']));
    }

    const resumes = documents?.filter(d => d.type === 'RESUME') || [];
    const coverLetters = documents?.filter(d => d.type === 'COVER_LETTER') || [];

    return (
        <Card className="border-t-4 border-brand-accent-success">
            <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>Manage your resumes and cover letters here. Select them when creating or editing a job application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? <Loader2 className="animate-spin text-brand-primary" /> : (
                    <>
                        {/* Resumes Section */}
                        <div>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Resumes ({resumes.length})</h4>
                                <Button size="sm" variant="outline" onClick={() => setShowResumeUploader(s => !s)}><PlusCircle className="mr-2 h-4 w-4"/>Add Resume</Button>
                            </div>
                            {showResumeUploader && <DocumentUploader type="RESUME" onUploadComplete={onUploadComplete}/>}
                            <div className="mt-2 space-y-2">
                                {resumes.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md bg-white dark:bg-slate-800">
                                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/><p className="font-medium">{doc.filename}</p></div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.filename)} disabled={isDeleting}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" /></Button>
                                    </div>
                                ))}
                                {resumes.length === 0 && !showResumeUploader && <p className="text-sm text-muted-foreground text-center py-4">No resumes uploaded yet.</p>}
                            </div>
                        </div>

                        {/* Cover Letters Section */}
                         <div>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Cover Letters ({coverLetters.length})</h4>
                                <Button size="sm" variant="outline" onClick={() => setShowCoverLetterUploader(s => !s)}><PlusCircle className="mr-2 h-4 w-4"/>Add Cover Letter</Button>
                            </div>
                            {showCoverLetterUploader && <DocumentUploader type="COVER_LETTER" onUploadComplete={onUploadComplete}/>}
                             <div className="mt-2 space-y-2">
                                {coverLetters.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md bg-white dark:bg-slate-800">
                                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/><p className="font-medium">{doc.filename}</p></div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.filename)} disabled={isDeleting}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" /></Button>
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
'use client'

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploaderProps {
    type: 'RESUME' | 'COVER_LETTER';
    onUploadComplete: () => void;
}

export function DocumentUploader({ type, onUploadComplete }: DocumentUploaderProps) {
    const { data: session } = useSession();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [latexSource, setLatexSource] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        if (!session) {
            toast.error("Authentication error. Please log in again.");
            return;
        }
        
        setIsUploading(true);

        try {
            // Step 1: Get a presigned URL from our backend
            const presignedUrlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/uploads/presigned-url`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${session.accessToken}` 
                },
                body: JSON.stringify({ filename: selectedFile.name, contentType: selectedFile.type })
            });
            if (!presignedUrlRes.ok) throw new Error("Could not get an upload URL from the server.");
            const { signedUrl, key } = await presignedUrlRes.json();

            // Step 2: Upload the file directly to S3 using the presigned URL
            const s3UploadRes = await fetch(signedUrl, { method: 'PUT', body: selectedFile });
            if (!s3UploadRes.ok) throw new Error("File upload to storage failed.");

            // Step 3: Create the document record in our database
            const docCreateBody: {
                filename: string;
                fileKey: string;
                type: 'RESUME' | 'COVER_LETTER';
                latexSource?: string;
            } = { 
                filename: selectedFile.name, 
                fileKey: key, 
                type,
                ...(type === 'RESUME' && latexSource && { latexSource: latexSource })
            };
            
            const docCreateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${session.accessToken}` 
                },
                body: JSON.stringify(docCreateBody)
            });
            if (!docCreateRes.ok) throw new Error("Failed to save the document record.");
            
            toast.success(`File "${selectedFile.name}" uploaded successfully!`);
            onUploadComplete();

        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-md mt-2 bg-muted/50">
            <Tabs defaultValue="file">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="latex" disabled={type !== 'RESUME'}>
                        Add LaTeX Source
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="pt-4 space-y-2">
                     <Label htmlFor="file-upload">
                        {type === 'RESUME' ? 'Upload PDF or DOCX File' : 'Upload Cover Letter File'}
                     </Label>
                     <Input 
                        id="file-upload"
                        type="file" 
                        onChange={handleFileChange} 
                        disabled={isUploading}
                        accept=".pdf,.doc,.docx" 
                    />
                    <p className="text-xs text-muted-foreground">
                        This file will be used for display and analysis.
                    </p>
                </TabsContent>
                <TabsContent value="latex" className="pt-4 space-y-2">
                    <Label htmlFor="latex-source">Paste your full LaTeX source code</Label>
                     <Textarea
                        id="latex-source"
                        value={latexSource}
                        onChange={(e) => setLatexSource(e.target.value)}
                        placeholder="\\documentclass{article}..."
                        rows={8}
                        disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                        Providing this enables the "AI Resume Rebuilder" feature. The uploaded file should be the PDF compiled from this source.
                    </p>
                </TabsContent>
            </Tabs>
            <div className="flex justify-end pt-4">
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Upload Document
                </Button>
            </div>
        </div>
    );
}
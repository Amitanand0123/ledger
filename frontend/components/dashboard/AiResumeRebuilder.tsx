// frontend/components/dashboard/AiResumeRebuilder.tsx
'use client';

import { useEffect, useState } from "react";
import { useGetDocumentsQuery } from "@/lib/redux/slices/documentApiSlice";
import { useRebuildResumeMutation } from "@/lib/redux/slices/agentApiSlice"; // We will add this mutation
import { useUpdateJobMutation } from "@/lib/redux/slices/jobsApiSlice";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2, Wand2, Download } from "lucide-react";
import { toast } from "sonner";
import { UserDocument } from "@/lib/types";
import { useSession } from "next-auth/react";

interface AiResumeRebuilderProps { jobId: string; }

export function AiResumeRebuilder({ jobId }: AiResumeRebuilderProps) {
    const [selectedResumeId, setSelectedResumeId] = useState<string>("");
    
    const { data: resumes, isLoading: isLoadingResumes } = useGetDocumentsQuery('RESUME');
    const [rebuildResume, { data, isLoading: isRebuilding, error }] = useRebuildResumeMutation();
    const [updateJob] = useUpdateJobMutation();
    const { data: session } = useSession();
    
    const resumesWithLatex = resumes?.filter((r: UserDocument) => {
        return r.latexSource !== null && r.latexSource !== undefined && r.latexSource.trim() !== '';
    });

    useEffect(() => {
        if (resumesWithLatex && resumesWithLatex.length > 0 && !selectedResumeId) {
            setSelectedResumeId(resumesWithLatex[0].id);
        }
    }, [resumesWithLatex, selectedResumeId]);

    const handleRebuild = async () => {
        if (!selectedResumeId) {
            toast.error("Please select a resume that has LaTeX source code.");
            return;
        }
        
        try {
            const result = await rebuildResume({ jobId, resumeId: selectedResumeId }).unwrap();
            toast.success("Resume rebuilt! Attaching it to this job application.");
            // Automatically attach the new resume to the job
            await updateJob({ id: jobId, resumeId: result.newDocument.id }).unwrap();
        } catch (err: any) {
            const errorMessage = err.data?.message || "An unknown error occurred while rebuilding.";
            toast.error(errorMessage);
        }
    };

    const handleDownload = async (doc: UserDocument) => {
        if (!session?.accessToken) {
            toast.error("Authentication error.");
            return;
        }

        const toastId = toast.loading("Generating secure download link...");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${doc.id}/download-url`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });

            if (!res.ok) throw new Error("Could not get download link.");

            const { url } = await res.json();
            
            // Trigger the download by opening the secure URL in a new tab
            window.open(url, '_blank');
            toast.success("Download started!", { id: toastId });

        } catch (error) {
            toast.error("Failed to generate download link.", { id: toastId });
        }
    };

    return (
        <div className="space-y-4 rounded-lg border bg-blue-50 dark:bg-blue-950/50 p-4">
            <h4 className="font-semibold text-foreground flex items-center">
                <Wand2 className="mr-2 h-5 w-5 text-blue-500"/>
                AI Resume Rebuilder
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={isLoadingResumes || !resumesWithLatex || resumesWithLatex.length === 0}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingResumes ? "Loading resumes..." : "Select resume with LaTeX"}/>
                    </SelectTrigger>
                    <SelectContent>
                        {!resumesWithLatex || resumesWithLatex.length === 0 ? (
                           <div className="p-4 text-center text-sm text-muted-foreground">No resumes with LaTeX source found.</div>
                        ) : (
                            resumesWithLatex.map(resume => (
                                <SelectItem key={resume.id} value={resume.id}>{resume.filename}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button onClick={handleRebuild} disabled={!selectedResumeId || isRebuilding} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    {isRebuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                     Rebuild for this Job
                </Button>
            </div>
            
            {data && (
                <div className="border-t pt-4 mt-4 flex items-center justify-between bg-green-100 dark:bg-green-900/50 p-3 rounded-md">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                        Successfully generated: {data.newDocument.filename}
                    </p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(data.newDocument)}
                    >
                        <Download className="mr-2 h-4 w-4"/> Download
                    </Button>
                </div>
            )}
        </div>
    );
}
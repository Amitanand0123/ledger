'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { JobApplication } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Edit, Trash2, Info, FileText, Calendar,
    FolderOpen, Sparkles,
} from 'lucide-react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setEditingJob, openJobFormModal } from '@/lib/redux/slices/uiSlice';
import { useDeleteJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { deleteGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { toast } from 'sonner';

import { JobDetailsTab } from './tabs/job-details-tab';
import { JobDescriptionTab } from './tabs/job-description-tab';
import { JobInterviewsTab } from './tabs/job-interviews-tab';
import { JobDocumentsTab } from './tabs/job-documents-tab';
import { JobAiToolsTab } from './tabs/job-ai-tools-tab';

interface JobDetailsPageContentProps {
    job: JobApplication;
    isGuest: boolean;
}

const VALID_TABS = ['details', 'description', 'interviews', 'documents', 'ai-tools'];

export function JobDetailsPageContent({ job, isGuest }: JobDetailsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const [deleteJobApi] = useDeleteJobMutation();

    const currentTab = searchParams.get('tab') || 'details';
    const activeTab = VALID_TABS.includes(currentTab) ? currentTab : 'details';

    const handleTabChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'details') {
            params.delete('tab');
        } else {
            params.set('tab', value);
        }
        const query = params.toString();
        router.replace(`/jobs/${job.id}${query ? `?${query}` : ''}`, { scroll: false });
    }, [router, searchParams, job.id]);

    const handleBack = () => router.push('/dashboard');

    const handleEdit = () => {
        dispatch(setEditingJob(job));
        dispatch(openJobFormModal());
        router.push('/dashboard');
    };

    const handleDelete = () => {
        toast.warning(`Delete application for ${job.position}?`, {
            action: {
                label: 'Delete',
                onClick: () => {
                    if (isGuest) {
                        dispatch(deleteGuestJob(job.id));
                        toast.success('Demo job deleted.');
                        router.push('/dashboard');
                    } else {
                        toast.promise(deleteJobApi(job.id).unwrap(), {
                            loading: 'Deleting...',
                            success: () => {
                                router.push('/dashboard');
                                return 'Application deleted.';
                            },
                            error: 'Failed to delete.',
                        });
                    }
                },
            },
        });
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit -ml-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">
                            {job.position}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground flex-wrap text-sm">
                            <span className="text-base">{job.company}</span>
                            {job.location && <span>• {job.location}</span>}
                            {job.salary && (
                                <span className="text-brand-primary font-medium">
                                    • {job.salary}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                            {job.status?.replace(/_/g, ' ')}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-6 h-auto p-1 bg-muted/50 backdrop-blur">
                    <TabsTrigger
                        value="details"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">Details</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="description"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Description</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="interviews"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Interviews & Notes</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                    >
                        <FolderOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Documents</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="ai-tools"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md py-3"
                        disabled={!session}
                    >
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">AI Tools</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                    <JobDetailsTab job={job} />
                </TabsContent>
                <TabsContent value="description" className="mt-4">
                    <JobDescriptionTab job={job} />
                </TabsContent>
                <TabsContent value="interviews" className="mt-4">
                    <JobInterviewsTab job={job} />
                </TabsContent>
                <TabsContent value="documents" className="mt-4">
                    <JobDocumentsTab job={job} />
                </TabsContent>
                <TabsContent value="ai-tools" className="mt-4">
                    <JobAiToolsTab job={job} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

'use client';

import { JobApplication } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Edit, Trash2, ExternalLink, MapPin, Calendar, DollarSign,
    Briefcase, ChevronDown, ChevronUp, Sparkles, RefreshCw, Target,
} from 'lucide-react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setEditingJob, openJobFormModal, openInterviewModal, openOfferModal } from '@/lib/redux/slices/uiSlice';
import { useDeleteJobMutation, useGetJobByIdQuery, useRescoreJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusCombobox } from './status-combobox';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { Progress } from '@/components/ui/progress';

interface JobDetailPanelProps {
    jobId: string;
    /** Pass the job directly for guest mode (skips API call) */
    guestJob?: JobApplication | null;
}

const STATUS_LABELS: Record<string, string> = {
    INTERESTED: 'Interested',
    PREPARING: 'Preparing',
    READY_TO_APPLY: 'Ready to Apply',
    APPLIED: 'Applied',
    OA: 'Online Assessment',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
};

export function JobDetailPanel({ jobId, guestJob }: JobDetailPanelProps) {
    const dispatch = useAppDispatch();
    const { data: apiJob, isLoading } = useGetJobByIdQuery(jobId, {
        skip: !!guestJob,
    });
    const [deleteJobApi] = useDeleteJobMutation();
    const [updateJob] = useUpdateJobMutation();
    const [rescoreJob, { isLoading: isRescoring }] = useRescoreJobMutation();
    const [showDescription, setShowDescription] = useState(false);
    const router = useRouter();

    const job = guestJob || apiJob;

    if (!guestJob && (isLoading || !job)) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Job not found
            </div>
        );
    }

    const handleEdit = () => {
        dispatch(setEditingJob(job));
        dispatch(openJobFormModal());
    };

    const handleDelete = () => {
        toast.warning(`Delete application for ${job.position}?`, {
            action: {
                label: 'Delete',
                onClick: () => {
                    toast.promise(deleteJobApi(job.id).unwrap(), {
                        loading: 'Deleting...',
                        success: 'Application deleted.',
                        error: 'Failed to delete.',
                    });
                },
            },
        });
    };

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === 'INTERVIEW') {
            dispatch(openInterviewModal(job));
        } else if (newStatus === 'OFFER') {
            dispatch(openOfferModal(job));
        } else {
            updateJob({ id: job.id, status: newStatus as any }).unwrap().catch(() => {
                toast.error('Failed to update status.');
            });
        }
    };

    const handleRescore = () => {
        toast.promise(rescoreJob(job.id).unwrap(), {
            loading: 'Scoring with AI...',
            success: 'Job scored!',
            error: 'Could not score. Ensure job has a description and you have a resume.',
        });
    };

    const scoreColor = job.aiScore != null
        ? job.aiScore >= 75 ? 'text-emerald-500'
            : job.aiScore >= 50 ? 'text-amber-500'
                : 'text-red-500'
        : '';

    return (
        <div className="h-full overflow-y-auto p-5 space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold truncate">{job.position}</h2>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <Button variant="outline" size="sm">
                                VIEW <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    {job.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(job.applicationDate)}
                    </span>
                    {job.salary && (
                        <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {job.salary}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <StatusCombobox
                        currentStatus={job.status}
                        onStatusChange={handleStatusChange}
                    />
                    {job.platform && (
                        <Badge variant="outline" className="text-xs">
                            {job.platform.name}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
                {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <ExternalLink className="mr-1 h-3 w-3" /> View Listing
                        </Button>
                    </a>
                )}
                {job.description && (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/resume-tools?jobId=${job.id}`)}>
                        <Target className="mr-1 h-3 w-3" /> Score Resume
                    </Button>
                )}
            </div>

            {/* Details Grid */}
            <div>
                <h3 className="text-sm font-semibold mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 border rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Platform</span>
                        <p className="font-medium mt-0.5">{job.platform?.name || 'Not specified'}</p>
                    </div>
                    <div className="p-2.5 border rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Applied</span>
                        <p className="font-medium mt-0.5">{formatDate(job.applicationDate)}</p>
                    </div>
                    {job.salary && (
                        <div className="p-2.5 border rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Salary</span>
                            <p className="font-medium text-brand-primary mt-0.5">{job.salary}</p>
                        </div>
                    )}
                    {job.deadline && (
                        <div className="p-2.5 border rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Deadline</span>
                            <p className="font-medium mt-0.5">{formatDate(job.deadline)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Fit Score */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        AI Fit Score
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleRescore} disabled={isRescoring} className="h-7 text-xs">
                        <RefreshCw className={`h-3 w-3 mr-1 ${isRescoring ? 'animate-spin' : ''}`} />
                        {isRescoring ? 'Scoring...' : 'Re-score'}
                    </Button>
                </div>
                {job.aiScore != null ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${scoreColor}`}>{job.aiScore}</span>
                            <span className="text-xs text-muted-foreground">/ 100</span>
                            <Progress value={job.aiScore} className="flex-1 h-2" />
                        </div>
                        {job.aiFitAssessment && (
                            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-amber-500/50 pl-3">
                                {job.aiFitAssessment}
                            </p>
                        )}
                        {job.aiTailoredSummary && (
                            <p className="text-xs italic text-muted-foreground">
                                &ldquo;{job.aiTailoredSummary}&rdquo;
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        No score yet. Click &ldquo;Re-score&rdquo; to analyze this job against your resume.
                    </p>
                )}
            </div>

            {/* Status History */}
            {job.statusHistory && job.statusHistory.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold mb-2">Status History</h3>
                    <div className="relative pl-4 border-l-2 border-muted space-y-3">
                        {job.statusHistory.map((item: any) => (
                            <div key={item.id} className="relative pl-3">
                                <div className="absolute -left-[13px] top-1 w-3 h-3 rounded-full bg-brand-primary border-2 border-card" />
                                <p className="text-xs font-medium">{STATUS_LABELS[item.status] || item.status}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(item.changedAt)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Interviews */}
            {job.interviews && job.interviews.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        Interviews ({job.interviews.length})
                    </h3>
                    <div className="space-y-2">
                        {job.interviews.map(interview => (
                            <div key={interview.id} className="p-2.5 border rounded-lg text-xs bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium capitalize">{interview.type.replace(/_/g, ' ')}</span>
                                    <span className="text-muted-foreground">
                                        {formatDate(interview.scheduledAt)}
                                    </span>
                                </div>
                                {interview.location && (
                                    <p className="text-muted-foreground mt-1">{interview.location}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Offer Details */}
            {(job.offerAmount || job.offerDeadline || job.offerStartDate || job.offerNotes) && (
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Offer Details
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {job.offerAmount && (
                            <div className="p-2.5 border rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Offer Amount</span>
                                <p className="font-medium text-brand-primary mt-0.5">{job.offerAmount}</p>
                            </div>
                        )}
                        {job.offerDeadline && (
                            <div className="p-2.5 border rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Response Deadline</span>
                                <p className="font-medium mt-0.5">{formatDate(job.offerDeadline)}</p>
                            </div>
                        )}
                        {job.offerStartDate && (
                            <div className="p-2.5 border rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Start Date</span>
                                <p className="font-medium mt-0.5">{formatDate(job.offerStartDate)}</p>
                            </div>
                        )}
                    </div>
                    {job.offerNotes && (
                        <p className="text-xs text-muted-foreground mt-2 border-l-2 border-emerald-500/50 pl-3">
                            {job.offerNotes}
                        </p>
                    )}
                </div>
            )}

            {/* Notes */}
            {job.notes && job.notes.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold mb-2">Notes ({job.notes.length})</h3>
                    <div className="space-y-2">
                        {job.notes.slice(0, 3).map(note => (
                            <div key={note.id} className="p-2.5 border rounded-lg text-xs bg-muted/30">
                                <p className="line-clamp-3">{note.content}</p>
                                <p className="text-muted-foreground mt-1">
                                    {formatDate(note.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description (collapsible) */}
            {job.description && (
                <div>
                    <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center gap-1.5 text-sm font-semibold hover:text-brand-primary transition-colors"
                    >
                        Description
                        {showDescription ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showDescription && (
                        <div className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                            {job.description}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeInterviewModal } from '@/lib/redux/slices/uiSlice';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { jobsApiSlice } from '@/lib/redux/slices/jobsApiSlice';
import { InterviewType } from '@/lib/types';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2 } from 'lucide-react';

const interviewTypeLabels: Record<InterviewType, string> = {
    PHONE_SCREEN: 'Phone Screen',
    TECHNICAL: 'Technical',
    BEHAVIORAL: 'Behavioral',
    SYSTEM_DESIGN: 'System Design',
    CULTURAL_FIT: 'Cultural Fit',
    FINAL_ROUND: 'Final Round',
    OTHER: 'Other',
};

export function InterviewScheduleModal() {
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const job = useAppSelector((state) => state.ui.jobForInterviewModal);
    const [updateJobApi] = useUpdateJobMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: 'PHONE_SCREEN' as InterviewType,
        scheduledAt: '',
        duration: '',
        location: '',
        notes: '',
    });

    const handleClose = () => {
        dispatch(closeInterviewModal());
        setFormData({ type: 'PHONE_SCREEN', scheduledAt: '', duration: '', location: '', notes: '' });
    };

    const updateStatus = async () => {
        if (!job) return;
        await updateJobApi({ id: job.id, status: 'INTERVIEW' }).unwrap();
    };

    const handleSkip = async () => {
        try {
            await updateStatus();
            toast.success('Status updated to Interview');
            handleClose();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !session?.accessToken) return;

        if (!formData.scheduledAt) {
            toast.error('Please select a date and time');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update job status
            await updateStatus();

            // 2. Create interview
            const payload = {
                jobId: job.id,
                type: formData.type,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                location: formData.location || undefined,
                notes: formData.notes || undefined,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/interviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to schedule interview');

            // Refresh job data
            dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: job.id }, { type: 'Job', id: 'LIST' }]));
            toast.success('Interview scheduled');
            handleClose();
        } catch {
            toast.error('Failed to schedule interview.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!job) return null;

    return (
        <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-brand-primary" />
                        Schedule Interview
                    </DialogTitle>
                    <DialogDescription>
                        {job.position} at {job.company} — Add interview details or skip to just update the status.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <Label className="mb-1">Interview Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: InterviewType) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(interviewTypeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="mb-1">Date & Time *</Label>
                        <Input
                            type="datetime-local"
                            value={formData.scheduledAt}
                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="mb-1">Duration (minutes)</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 60"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mb-1">Location / Link</Label>
                            <Input
                                placeholder="Zoom, office, etc."
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="mb-1">Notes</Label>
                        <Textarea
                            placeholder="Interviewer names, topics to prepare, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                            Skip
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule & Update Status
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

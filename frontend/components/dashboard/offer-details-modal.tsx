'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeOfferModal } from '@/lib/redux/slices/uiSlice';
import { useUpdateJobMutation, jobsApiSlice } from '@/lib/redux/slices/jobsApiSlice';
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
import { DollarSign, Loader2 } from 'lucide-react';

export function OfferDetailsModal() {
    const dispatch = useAppDispatch();
    const job = useAppSelector((state) => state.ui.jobForOfferModal);
    const [updateJobApi] = useUpdateJobMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        offerAmount: '',
        offerDeadline: '',
        offerStartDate: '',
        offerNotes: '',
    });

    const handleClose = () => {
        dispatch(closeOfferModal());
        setFormData({ offerAmount: '', offerDeadline: '', offerStartDate: '', offerNotes: '' });
    };

    const handleSkip = async () => {
        if (!job) return;
        try {
            await updateJobApi({ id: job.id, status: 'OFFER' }).unwrap();
            toast.success('Status updated to Offer');
            handleClose();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        setIsSubmitting(true);
        try {
            await updateJobApi({
                id: job.id,
                status: 'OFFER',
                ...(formData.offerAmount && { offerAmount: formData.offerAmount }),
                ...(formData.offerDeadline && { offerDeadline: new Date(formData.offerDeadline).toISOString() }),
                ...(formData.offerStartDate && { offerStartDate: new Date(formData.offerStartDate).toISOString() }),
                ...(formData.offerNotes && { offerNotes: formData.offerNotes }),
            } as any).unwrap();

            dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: job.id }, { type: 'Job', id: 'LIST' }]));
            toast.success('Offer details saved');
            handleClose();
        } catch {
            toast.error('Failed to save offer details.');
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
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        Offer Details
                    </DialogTitle>
                    <DialogDescription>
                        {job.position} at {job.company} — Add offer details or skip to just update the status.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Offer Amount</Label>
                        <Input
                            placeholder="e.g., $150,000/year"
                            value={formData.offerAmount}
                            onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Response Deadline</Label>
                            <Input
                                type="date"
                                value={formData.offerDeadline}
                                onChange={(e) => setFormData({ ...formData, offerDeadline: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Proposed Start Date</Label>
                            <Input
                                type="date"
                                value={formData.offerStartDate}
                                onChange={(e) => setFormData({ ...formData, offerStartDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Benefits, equity, signing bonus, etc."
                            value={formData.offerNotes}
                            onChange={(e) => setFormData({ ...formData, offerNotes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                            Skip
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Update Status
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

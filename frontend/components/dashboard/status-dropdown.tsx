'use client';

import { Status } from '@/lib/types';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { updateGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuRadioGroup, 
    DropdownMenuRadioItem, 
    DropdownMenuTrigger, 
} from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

const STATUS_OPTIONS: Status[] = [
    'PENDING', 
    'SHORTLISTED', 
    'OA',
    'INTERVIEW_1', 
    'INTERVIEW_2', 
    'INTERVIEW_FINAL', 
    'HIRED', 
    'REJECTED',
];

const statusColorMap: Record<Status, string> = {
    PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    SHORTLISTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    OA: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    INTERVIEW_1: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    INTERVIEW_2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    INTERVIEW_FINAL: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    HIRED: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface StatusDropdownProps {
    jobId: string;
    currentStatus: Status;
}

export function StatusDropdown({ jobId, currentStatus }: StatusDropdownProps) {
    const { data: session } = useSession();
    const [updateJob, { isLoading }] = useUpdateJobMutation();
    const dispatch = useAppDispatch();
    const isGuest = !session;

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === currentStatus) {
            return;
        }

        const newStatusTyped = newStatus as Status;
        
        if (isGuest) {
            dispatch(updateGuestJob({ id: jobId, status: newStatusTyped }));
            toast.info('Status updated for demo job.');
        } else {
            toast.promise(updateJob({ id: jobId, status: newStatusTyped }).unwrap(), {
                loading: 'Updating status...',
                success: `Status updated to ${newStatusTyped.replace(/_/g, ' ')}`,
                error: 'Failed to update status.',
            });
        }
    };
    
    const badgeColorClass = statusColorMap[currentStatus] || 'bg-gray-500';
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button 
                    disabled={isLoading}
                    aria-label={`Change status for this job. Current status: ${currentStatus.replace(/_/g, ' ')}`}
                    className="rounded-full transition-transform duration-200 hover:scale-105"
                >
                    <Badge className={`px-3 py-1 text-xs font-semibold ${badgeColorClass}`}>
                        {currentStatus.replace(/_/g, ' ')}
                    </Badge>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuRadioGroup value={currentStatus} onValueChange={handleStatusChange}>
                    {STATUS_OPTIONS.map(status => (
                        <DropdownMenuRadioItem 
                            key={status} 
                            value={status}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${statusColorMap[status]}`}></span>
                                {status.replace(/_/g, ' ')}
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
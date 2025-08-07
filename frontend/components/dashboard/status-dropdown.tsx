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

// An array defining the order and availability of statuses
const STATUS_OPTIONS: Status[] = [
    'PENDING', 
    'SHORTLISTED', 
    'OA', // Online Assessment
    'INTERVIEW_1', 
    'INTERVIEW_2', 
    'INTERVIEW_FINAL', 
    'HIRED', 
    'REJECTED',
];

// A mapping from each status to a specific Tailwind CSS background color class.
// We'll use your custom theme colors and some standard ones for semantics.
const statusColorMap: Record<Status, string> = {
    PENDING: 'bg-gray-400 dark:bg-gray-600',
    SHORTLISTED: 'bg-brand-secondary', // Using your theme
    OA: 'bg-yellow-500',
    INTERVIEW_1: 'bg-brand-primary', // Using your theme
    INTERVIEW_2: 'bg-brand-primary/80', // Using your theme with opacity
    INTERVIEW_FINAL: 'bg-brand-primary/60', // Using your theme with more opacity
    HIRED: 'bg-brand-accent-success text-green-900', // Using your theme
    REJECTED: 'bg-red-600',
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
        // Prevent API calls if the status hasn't changed
        if (newStatus === currentStatus) {
            return;
        }

        const newStatusTyped = newStatus as Status;
        
        if (isGuest) {
            // Handle guest mode: dispatch a local Redux action
            dispatch(updateGuestJob({ id: jobId, status: newStatusTyped }));
            toast.info('Status updated for demo job.');
        } else {
            // Handle authenticated user: call the RTK Query mutation
            toast.promise(updateJob({ id: jobId, status: newStatusTyped }).unwrap(), {
                loading: 'Updating status...',
                success: `Status updated to ${newStatusTyped.replace(/_/g, ' ')}`,
                error: 'Failed to update status.',
            });
        }
    };
    
    // Get the color class for the current status, with a fallback
    const badgeColorClass = statusColorMap[currentStatus] || 'bg-gray-500';
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {/* The button now contains a colorful, themed Badge */}
                <button 
                    disabled={isLoading}
                    aria-label={`Change status for this job. Current status: ${currentStatus.replace(/_/g, ' ')}`}
                    className="rounded-full transition-transform duration-200 hover:scale-105"
                >
                    <Badge className={`px-3 py-1 text-xs font-semibold text-white ${badgeColorClass}`}>
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
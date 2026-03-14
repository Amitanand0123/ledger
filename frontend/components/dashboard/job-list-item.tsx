'use client';

import { JobApplication } from '@/lib/types';
import { MapPin, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface JobListItemProps {
    job: JobApplication;
    isActive: boolean;
    isChecked: boolean;
    onSelect: (job: JobApplication) => void;
    onCheckChange: (jobId: string, checked: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
    INTERESTED: 'bg-blue-500',
    PREPARING: 'bg-indigo-500',
    READY_TO_APPLY: 'bg-purple-500',
    APPLIED: 'bg-sky-500',
    OA: 'bg-amber-500',
    INTERVIEW: 'bg-orange-500',
    OFFER: 'bg-emerald-500',
    ACCEPTED: 'bg-green-600',
    REJECTED: 'bg-red-500',
    WITHDRAWN: 'bg-gray-500',
};

export function JobListItem({ job, isActive, isChecked, onSelect, onCheckChange }: JobListItemProps) {
    const scoreColor = job.aiScore != null
        ? job.aiScore >= 75 ? 'text-emerald-500'
            : job.aiScore >= 50 ? 'text-amber-500'
                : 'text-red-500'
        : '';

    return (
        <div
            className={`flex items-start gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                isActive ? 'bg-muted/70 border-l-2 border-l-brand-primary' : 'border-l-2 border-l-transparent'
            }`}
            onClick={() => onSelect(job)}
        >
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => onCheckChange(job.id, !!checked)}
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[job.status] || 'bg-gray-400'}`} />
                    <p className="font-medium text-sm truncate">{job.company}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">{job.position}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {job.location && (
                        <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {job.location}
                        </span>
                    )}
                    {job.salary && (
                        <span className="truncate">{job.salary}</span>
                    )}
                </div>
            </div>

            {job.aiScore != null && (
                <div className={`text-sm font-bold shrink-0 ${scoreColor}`}>
                    {job.aiScore}
                </div>
            )}
        </div>
    );
}

'use client';

import { Status } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';

const STATUS_OPTIONS: Status[] = [
    'INTERESTED',
    'PREPARING',
    'READY_TO_APPLY',
    'APPLIED',
    'OA',
    'INTERVIEW',
    'OFFER',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
];
const FILTER_STATUS_OPTIONS: (Status | 'ALL')[] = ['ALL', ...STATUS_OPTIONS];

const statusDescriptions: Record<string, string> = {
    INTERESTED: 'Found a job you want to apply to',
    PREPARING: 'Working on application materials',
    READY_TO_APPLY: 'Application optimized and ready',
    APPLIED: 'Application submitted',
    OA: 'Online assessment received',
    INTERVIEW: 'Interview scheduled',
    OFFER: 'Job offer received',
    ACCEPTED: 'Offer accepted',
    REJECTED: 'Application rejected',
    WITHDRAWN: 'Withdrew application',
};

const statusColorMap: Record<string, string> = {
    INTERESTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    PREPARING: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    READY_TO_APPLY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    APPLIED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    OA: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    INTERVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    OFFER: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ACCEPTED: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    WITHDRAWN: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    ALL: 'bg-muted text-muted-foreground',
};

const statusDotColor: Record<string, string> = {
    INTERESTED: 'bg-blue-500',
    PREPARING: 'bg-indigo-500',
    READY_TO_APPLY: 'bg-purple-500',
    APPLIED: 'bg-gray-500',
    OA: 'bg-amber-500',
    INTERVIEW: 'bg-amber-500',
    OFFER: 'bg-purple-500',
    ACCEPTED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    WITHDRAWN: 'bg-gray-400',
};

const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase().replace(/\s/g, '_');
    return statusColorMap[upperStatus] || 'bg-blue-500 text-white';
};

const getStatusDotColor = (status: string) => {
    const upperStatus = status.toUpperCase().replace(/\s/g, '_');
    return statusDotColor[upperStatus] || 'bg-blue-500';
};

interface StatusComboboxProps {
    currentStatus: Status | 'ALL';
    onStatusChange: (newStatus: any) => void;
    isFilter?: boolean;
}

export function StatusCombobox({ currentStatus, onStatusChange, isFilter = false }: StatusComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const options = isFilter ? FILTER_STATUS_OPTIONS : STATUS_OPTIONS;

    const handleSelect = (newStatus: string) => {
        setOpen(false);
        if (newStatus !== currentStatus) {
            onStatusChange(newStatus);
        }
        setSearchValue('');
    };
    
    const badgeColorClass = currentStatus ? getStatusColor(currentStatus) : 'bg-muted text-muted-foreground';
    const triggerText = currentStatus ? currentStatus.replace(/_/g, ' ') : 'Change Status';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={`min-w-[140px] w-fit justify-between h-auto p-0 border-none bg-transparent hover:bg-transparent ${badgeColorClass}`}>
                    <Badge className={`min-w-[140px] w-fit relative justify-center px-3 py-1.5 text-xs font-semibold ${badgeColorClass}`}>
                        {isFilter && currentStatus === 'ALL' ? 'All Statuses' : triggerText}
                        <ChevronsUpDown className="absolute right-1.5 h-3 w-3 shrink-0 opacity-50" />
                    </Badge>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" onWheel={(e) => e.stopPropagation()}>
                <Command>
                    <CommandInput placeholder="Search or add..." onValueChange={setSearchValue} />
                    <CommandList className="scroll-smooth">
                        <CommandEmpty>
                            <CommandItem onSelect={() => handleSelect(searchValue)} className="cursor-pointer">
                                <PlusCircle className="mr-2 h-4 w-4"/> Add: &ldquo;{searchValue}&ldquo;
                            </CommandItem>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map(status => (
                                <CommandItem key={status} value={status} onSelect={() => handleSelect(status)} className="cursor-pointer flex-col items-start py-2">
                                    <div className="flex items-center w-full">
                                        <Check className={`mr-2 h-3.5 w-3.5 ${currentStatus === status ? 'opacity-100' : 'opacity-0'}`} />
                                        <span className={`h-2.5 w-2.5 rounded-full mr-2 shrink-0 ${getStatusDotColor(status)}`}></span>
                                        <span className="text-xs font-medium">{status === 'ALL' ? 'All Statuses' : status.replace(/_/g, ' ')}</span>
                                    </div>
                                    {status !== 'ALL' && statusDescriptions[status] && (
                                        <span className="text-xs text-muted-foreground ml-6 mt-0.5">
                                            {statusDescriptions[status]}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
'use client';

import { Status } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { Button } from "../ui/button";

const STATUS_OPTIONS: Status[] = ["PENDING", "SHORTLISTED", "OA", "INTERVIEW_1", "INTERVIEW_2", "INTERVIEW_FINAL", "HIRED", "REJECTED"];
const FILTER_STATUS_OPTIONS: (Status | "ALL")[] = ["ALL", ...STATUS_OPTIONS];

const statusColorMap: Record<string, string> = {
    PENDING: "bg-gray-400 text-gray-900",
    SHORTLISTED: "bg-[#A4CCD9] text-gray-900",
    OA: "bg-yellow-500 text-white",
    INTERVIEW_1: "bg-[#8DBCC7] text-white",
    INTERVIEW_2: "bg-[#8DBCC7]/80 text-white",
    INTERVIEW_FINAL: "bg-[#8DBCC7]/60 text-white",
    HIRED: "bg-green-500 text-white",
    REJECTED: "bg-red-600 text-white",
    ALL: "bg-muted text-muted-foreground"
};

const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase().replace(/\s/g, '_');
    return statusColorMap[upperStatus] || "bg-blue-500 text-white";
};

interface StatusComboboxProps {
    currentStatus: Status | 'ALL';
    onStatusChange: (newStatus: any) => void;
    isFilter?: boolean;
}

export function StatusCombobox({ currentStatus, onStatusChange, isFilter = false }: StatusComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const options = isFilter ? FILTER_STATUS_OPTIONS : STATUS_OPTIONS;

    const handleSelect = (newStatus: string) => {
        setOpen(false);
        if (newStatus !== currentStatus) {
            onStatusChange(newStatus);
        }
        setSearchValue("");
    };
    
    const badgeColorClass = getStatusColor(currentStatus);
    const triggerText = currentStatus.replace(/_/g, ' ');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* FIXED: Added fixed width to the button */}
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-[130px] justify-between p-0 border-none bg-transparent hover:bg-transparent">
                    <Badge className={`w-full justify-between px-3 py-1 text-xs font-semibold ${badgeColorClass}`}>
                        {isFilter && currentStatus === 'ALL' ? 'All Statuses' : triggerText}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Badge>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search or add..." onValueChange={setSearchValue} />
                    <CommandList>
                        {/* FIXED: Allow adding custom status */}
                        <CommandEmpty>
                            <CommandItem onSelect={() => handleSelect(searchValue)} className="cursor-pointer">
                                <PlusCircle className="mr-2 h-4 w-4"/> Add: &ldquo;{searchValue}&ldquo;
                            </CommandItem>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map(status => (
                                <CommandItem key={status} value={status} onSelect={() => handleSelect(status)} className="cursor-pointer">
                                    <Check className={`mr-2 h-4 w-4 ${currentStatus === status ? "opacity-100" : "opacity-0"}`} />
                                    <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(status)}`}></span>
                                    {status === 'ALL' ? 'All Statuses' : status.replace(/_/g, ' ')}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
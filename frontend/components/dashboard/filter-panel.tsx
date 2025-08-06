'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, XCircle, Calendar as CalendarIcon, Trash2, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearFilters, setDateRange, setSearch, setSalaryRange, setStatus } from "@/lib/redux/slices/filterSlice";
import { useDebouncedCallback } from 'use-debounce';
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useDeleteJobMutation } from "@/lib/redux/slices/jobsApiSlice";
import { toast } from "sonner";
import { deleteGuestJob } from "@/lib/redux/slices/guestJobsSlice";
import { useSession } from "next-auth/react";
import { StatusCombobox } from "./status-combobox";
import { useState } from "react";

interface FilterPanelProps {
    selectedIds: string[];
    clearSelection: () => void;
}

export function FilterPanel({ selectedIds, clearSelection }: FilterPanelProps) {
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const isGuest = !session;
    const filters = useAppSelector(state => state.filters);
    const [deleteJobApi, { isLoading: isApiDeleting }] = useDeleteJobMutation();
    const [isDeleting, setIsDeleting] = useState(false);

    const date: DateRange | undefined = filters.dateRange ? JSON.parse(filters.dateRange) : undefined;
    
    const debouncedSearch = useDebouncedCallback((value: string) => dispatch(setSearch(value)), 300);
    const debouncedSalary = useDebouncedCallback(({ min, max }: { min: string, max: string }) => dispatch(setSalaryRange({ min, max })), 500);

    const handleClearFilters = () => {
        dispatch(clearFilters());
        // Also clear the input fields visually
        (document.getElementById('search-input') as HTMLInputElement).value = '';
        (document.getElementById('min-salary-input') as HTMLInputElement).value = '';
        (document.getElementById('max-salary-input') as HTMLInputElement).value = '';
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        
        toast.warning(`Are you sure you want to delete ${selectedIds.length} job application(s)?`, {
            action: {
                label: 'Confirm Delete',
                onClick: async () => {
                    setIsDeleting(true);
                    if (isGuest) {
                        selectedIds.forEach(id => dispatch(deleteGuestJob(id)));
                        toast.success(`${selectedIds.length} demo job(s) deleted.`);
                        clearSelection();
                        setIsDeleting(false);
                        return;
                    }
                    try {
                        // A true bulk delete is one API call. We simulate it with Promise.all.
                        // The backend has a `DELETE /jobs` endpoint that accepts an array of IDs.
                        // For now, this is a placeholder for a single bulk delete call.
                        await Promise.all(selectedIds.map(id => deleteJobApi(id).unwrap()));
                        toast.success(`${selectedIds.length} job(s) deleted successfully.`);
                        clearSelection();
                    } catch (error) {
                        toast.error("Failed to delete one or more jobs. Please try again.");
                    } finally {
                        setIsDeleting(false);
                    }
                }
            },
            // cancel: {
            //   label: "Cancel"
            // },
            duration: 10000,
        });
    };

    const isLoading = isDeleting || isApiDeleting;

    return (
        <div className="flex flex-col md:flex-row items-center flex-wrap gap-4 py-4 px-1 border-b">
            {selectedIds.length > 0 ? (
                 <Button variant="destructive" onClick={handleBulkDelete} disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} 
                    Delete ({selectedIds.length})
                </Button>
            ) : (
                <div className="relative w-full md:flex-1 md:min-w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-input"
                        type="search"
                        placeholder="Search by company or position..."
                        className="pl-8 w-full"
                        defaultValue={filters.search}
                        onChange={(e) => debouncedSearch(e.target.value)}
                    />
                </div>
            )}
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <StatusCombobox 
                    currentStatus={filters.status}
                    onStatusChange={(value) => dispatch(setStatus(value))}
                    isFilter={true}
                />
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className="w-full md:w-[260px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={(range) => dispatch(setDateRange(JSON.stringify(range)))} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Input id="min-salary-input" type="number" placeholder="Min Salary" className="w-1/2 md:w-[120px]" defaultValue={filters.salaryMin} onChange={(e) => debouncedSalary({ min: e.target.value, max: filters.salaryMax })} min="0" />
                <Input id="max-salary-input" type="number" placeholder="Max Salary" className="w-1/2 md:w-[120px]" defaultValue={filters.salaryMax} onChange={(e) => debouncedSalary({ min: filters.salaryMin, max: e.target.value })} min="0" />
            </div>
            
            <Button variant="ghost" onClick={handleClearFilters} className="w-full md:w-auto text-muted-foreground">
                <XCircle className="mr-2 h-4 w-4"/> Clear Filters
            </Button>
        </div>
    );
}
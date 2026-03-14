'use client';

import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { jobsApiSlice, useGetJobsQuery, useGetStatusCountsQuery, useBulkDeleteJobsMutation, useBulkUpdateStatusMutation } from '@/lib/redux/slices/jobsApiSlice';
import { setPage, setSearch, setStatus, setDateRange, setSalaryRange, clearFilters } from '@/lib/redux/slices/filterSlice';
import { useSession } from 'next-auth/react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { EmptyState } from './empty-state';
import { Loader2, Search, X, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { useSocket } from '@/lib/hooks/useSocket';
import { toast } from 'sonner';
import { OnboardingModal } from '../onboarding/onboarding-modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { JobListItem } from './job-list-item';
import { JobDetailPanel } from './job-detail-panel';
import { StatusCombobox } from './status-combobox';
import { AddJobButton } from './add-job-button';
import { JobApplication } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { formatDate } from '@/lib/utils';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

const JobFormModal = dynamic(() => import('./job-form-modal').then(m => ({ default: m.JobFormModal })), { ssr: false });
const InterviewScheduleModal = dynamic(() => import('./interview-schedule-modal').then(m => ({ default: m.InterviewScheduleModal })), { ssr: false });
const OfferDetailsModal = dynamic(() => import('./offer-details-modal').then(m => ({ default: m.OfferDetailsModal })), { ssr: false });

const STATUS_TABS = [
    { label: 'All', value: 'ALL' },
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Interview', value: 'INTERVIEW' },
    { label: 'Offer', value: 'OFFER' },
    { label: 'Rejected', value: 'REJECTED' },
];

export function DashboardPageContent() {
    const { data: session, status: authStatus, update } = useSession();
    const isGuest = authStatus === 'unauthenticated';
    const dispatch = useAppDispatch();
    const socket = useSocket();

    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (authStatus === 'authenticated' && session?.accessToken && session?.user?.onboardingCompleted === false) {
            const timer = setTimeout(() => setShowOnboarding(true), 500);
            return () => clearTimeout(timer);
        }
    }, [authStatus, session?.accessToken, session?.user?.onboardingCompleted]);

    const handleOnboardingClose = async () => {
        setShowOnboarding(false);
        await update();
    };

    const filters = useAppSelector((state) => state.filters);
    const guestJobs = useAppSelector((state) => state.guestJobs.jobs);
    const { isJobFormModalOpen, isInterviewModalOpen, isOfferModalOpen } = useAppSelector((state) => state.ui);

    const { data: apiResponse, error, isLoading, isFetching } = useGetJobsQuery(filters, {
        skip: isGuest || authStatus === 'loading',
    });
    const { data: statusCounts } = useGetStatusCountsQuery(undefined, {
        skip: isGuest || authStatus === 'loading',
    });

    const [bulkUpdateStatus] = useBulkUpdateStatusMutation();
    const [bulkDeleteJobs] = useBulkDeleteJobsMutation();

    const apiJobs = apiResponse?.data;
    const pagination = apiResponse?.pagination;

    const dateRange: DateRange | undefined = filters.dateRange ? JSON.parse(filters.dateRange) : undefined;

    const debouncedSalary = useDebouncedCallback(
        ({ min, max }: { min: string; max: string }) => dispatch(setSalaryRange({ min, max })),
        500
    );

    const hasActiveFilters = !!filters.dateRange || !!filters.salaryMin || !!filters.salaryMax;

    // Socket listener for real-time updates
    useEffect(() => {
        if (socket) {
            const handleJobsUpdate = () => {
                toast.info('Your job board has been updated.');
                dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: 'LIST' }]));
            };
            socket.on('jobs_updated', handleJobsUpdate);
            return () => { socket.off('jobs_updated', handleJobsUpdate); };
        }
    }, [socket, dispatch]);

    // For guests, apply local status + search filtering
    const jobs = useMemo(() => {
        let list = isGuest ? guestJobs : (apiJobs || []);

        // Guest-side filtering (API handles this for authenticated users)
        if (isGuest) {
            if (filters.status && filters.status !== 'ALL') {
                list = list.filter(j => j.status === filters.status);
            }
            if (filters.search) {
                const q = filters.search.toLowerCase();
                list = list.filter(j =>
                    j.company.toLowerCase().includes(q) ||
                    j.position.toLowerCase().includes(q)
                );
            }
        }

        return [...list].sort((a, b) => a.order - b.order);
    }, [isGuest, guestJobs, apiJobs, filters.status, filters.search]);

    // Compute guest status counts locally
    const guestStatusCounts = useMemo(() => {
        if (!isGuest) return null;
        const counts: Record<string, number> = { ALL: guestJobs.length };
        guestJobs.forEach(j => {
            counts[j.status] = (counts[j.status] || 0) + 1;
        });
        return counts;
    }, [isGuest, guestJobs]);

    const effectiveCounts = isGuest ? guestStatusCounts : statusCounts;

    // Auto-select first job when list changes
    useEffect(() => {
        if (jobs.length > 0 && (!activeJobId || !jobs.find(j => j.id === activeJobId))) {
            setActiveJobId(jobs[0].id);
        }
        if (jobs.length === 0) {
            setActiveJobId(null);
        }
    }, [jobs, activeJobId]);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        dispatch(setSearch(value));
    }, 300);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        debouncedSearch(value);
    };

    const handleStatusTab = (value: string) => {
        dispatch(setStatus(value));
        setSelectedJobIds(new Set());
    };

    const handleSelectJob = useCallback((job: JobApplication) => {
        setActiveJobId(job.id);
        // Only open sheet on mobile (below lg breakpoint = 1024px)
        if (window.innerWidth < 1024) {
            setMobileDetailOpen(true);
        }
    }, []);

    const handleCheckChange = useCallback((jobId: string, checked: boolean) => {
        setSelectedJobIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(jobId);
            else next.delete(jobId);
            return next;
        });
    }, []);

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedJobIds(new Set(jobs.map(j => j.id)));
        else setSelectedJobIds(new Set());
    };

    const handleBulkStatusChange = (newStatus: string) => {
        const ids = Array.from(selectedJobIds);
        toast.promise(bulkUpdateStatus({ ids, status: newStatus }).unwrap(), {
            loading: `Updating ${ids.length} jobs...`,
            success: () => { setSelectedJobIds(new Set()); return 'Status updated!'; },
            error: 'Failed to update status.',
        });
    };

    const handleBulkDelete = () => {
        const ids = Array.from(selectedJobIds);
        toast.warning(`Delete ${ids.length} application(s)?`, {
            action: {
                label: 'Delete',
                onClick: () => {
                    toast.promise(bulkDeleteJobs({ ids }).unwrap(), {
                        loading: 'Deleting...',
                        success: () => { setSelectedJobIds(new Set()); return `${ids.length} deleted.`; },
                        error: 'Failed to delete.',
                    });
                },
            },
            duration: 10000,
        });
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
        setSearchInput('');
        setShowFilters(false);
    };

    const handlePageChange = (newPage: number) => {
        dispatch(setPage(newPage));
        setSelectedJobIds(new Set());
    };

    const showInitialLoading = isLoading && !isGuest;
    const hasJobs = jobs.length > 0;
    const isFiltered = !!filters.search || (!!filters.status && filters.status !== 'ALL') || hasActiveFilters;
    const activeGuestJob = isGuest && activeJobId ? guestJobs.find(j => j.id === activeJobId) || null : null;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-48px)]">
            {/* Status Tabs + Search + Filters */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b bg-background overflow-x-auto">
                {STATUS_TABS.map(tab => {
                    const count = effectiveCounts?.[tab.value];
                    return (
                        <button
                            key={tab.value}
                            onClick={() => handleStatusTab(tab.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                                filters.status === tab.value || (tab.value === 'ALL' && !filters.status)
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.label}{count != null ? ` (${count})` : ''}
                        </button>
                    );
                })}

                <div className="ml-auto flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-9 w-48 text-sm"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Add Job */}
                    <AddJobButton />

                    {/* Filter Toggle */}
                    <Button
                        variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
                        size="sm"
                        className="h-9"
                        onClick={() => setShowFilters(!showFilters)}
                        aria-label="Toggle filters"
                        aria-expanded={showFilters}
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-1" />
                        Filters
                        {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-white" />}
                    </Button>
                </div>
            </div>

            {/* Expandable Filter Row */}
            {showFilters && (
                <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20 flex-wrap">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <CalendarIcon className="mr-1.5 h-3 w-3" />
                                {dateRange?.from
                                    ? dateRange.to
                                        ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                                        : formatDate(dateRange.from)
                                    : 'Date range'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => dispatch(setDateRange(JSON.stringify(range)))}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="flex items-center gap-1.5">
                        <Input
                            type="number"
                            placeholder="Min salary"
                            className="h-8 w-24 text-xs"
                            defaultValue={filters.salaryMin}
                            onChange={(e) => debouncedSalary({ min: e.target.value, max: filters.salaryMax })}
                            min="0"
                        />
                        <span className="text-xs text-muted-foreground">-</span>
                        <Input
                            type="number"
                            placeholder="Max salary"
                            className="h-8 w-24 text-xs"
                            defaultValue={filters.salaryMax}
                            onChange={(e) => debouncedSalary({ min: filters.salaryMin, max: e.target.value })}
                            min="0"
                        />
                    </div>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={handleClearFilters}>
                            <XCircle className="h-3 w-3 mr-1" /> Clear
                        </Button>
                    )}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedJobIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b text-sm">
                    <span className="font-medium">{selectedJobIds.size} selected</span>
                    <StatusCombobox
                        currentStatus=""
                        onStatusChange={handleBulkStatusChange}
                        isFilter={false}
                    />
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedJobIds(new Set())}>
                        <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                </div>
            )}

            {/* Main Split Panel */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel — Job List */}
                <div className="w-full lg:w-[400px] lg:border-r flex flex-col shrink-0">
                    {/* Select All */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
                        <Checkbox
                            checked={jobs.length > 0 && selectedJobIds.size === jobs.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <span>
                            {selectedJobIds.size > 0
                                ? `${selectedJobIds.size} selected`
                                : 'Select all'}
                        </span>
                        {isFetching && !isLoading && (
                            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                        )}
                    </div>

                    {/* Job List */}
                    <div className="flex-1 overflow-y-auto">
                        {showInitialLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : error ? (
                            <div className="text-center p-6 text-destructive text-sm">Error loading jobs.</div>
                        ) : hasJobs ? (
                            jobs.map(job => (
                                <JobListItem
                                    key={job.id}
                                    job={job}
                                    isActive={activeJobId === job.id}
                                    isChecked={selectedJobIds.has(job.id)}
                                    onSelect={handleSelectJob}
                                    onCheckChange={handleCheckChange}
                                />
                            ))
                        ) : (
                            <EmptyState isFiltered={isFiltered} isGuest={isGuest} />
                        )}
                    </div>

                    {/* Pagination */}
                    {!isGuest && pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-2 border-t text-xs">
                            <span className="text-muted-foreground">
                                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-1">{pagination.page}/{pagination.totalPages}</span>
                                <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel — Job Details (desktop) */}
                <div className="hidden lg:flex flex-1 flex-col overflow-hidden bg-background">
                    {activeJobId ? (
                        <JobDetailPanel jobId={activeJobId} guestJob={activeGuestJob} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Select a job to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Detail Sheet */}
            <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0 lg:hidden">
                    <VisuallyHidden.Root>
                        <SheetTitle>Job Details</SheetTitle>
                    </VisuallyHidden.Root>
                    {activeJobId && <JobDetailPanel jobId={activeJobId} guestJob={activeGuestJob} />}
                </SheetContent>
            </Sheet>

            {/* Modals */}
            {isJobFormModalOpen && <JobFormModal />}
            {isInterviewModalOpen && <InterviewScheduleModal />}
            {isOfferModalOpen && <OfferDetailsModal />}
            {showOnboarding && <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />}
        </div>
    );
}

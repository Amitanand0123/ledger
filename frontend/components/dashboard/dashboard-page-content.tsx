'use client';

import { FilterPanel } from '@/components/dashboard/filter-panel';
import { JobFormModal } from '@/components/dashboard/job-form-modal';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { jobsApiSlice, useGetJobsQuery } from '@/lib/redux/slices/jobsApiSlice';
import { setPage } from '@/lib/redux/slices/filterSlice';
import { useSession } from 'next-auth/react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { EmptyState } from './empty-state';
import { JobCardSkeleton } from './job-card.skeleton';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { DragDropContainer } from './drag-drop-container';
import { Checkbox } from '../ui/checkbox';
import { DescriptionModal } from './description-modal';
import { useSocket } from '@/lib/hooks/useSocket';
import { toast } from 'sonner';
import { OnboardingModal } from '../onboarding/onboarding-modal';
import { Button } from '../ui/button';

function LoadingState() {
    return (
        <div className="space-y-3 p-1">
            {Array.from({ length: 8 }).map((_, index) => (
                <JobCardSkeleton key={index} />
            ))}
        </div>
    );
}

export function DashboardPageContent() {
  const { data: session, status, update } = useSession();
  const isGuest = status === 'unauthenticated';
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && session?.user?.onboardingCompleted === false) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, session?.accessToken, session?.user?.onboardingCompleted]);

  const handleOnboardingClose = async () => {
    setShowOnboarding(false);
    await update();
  };

  const filters = useAppSelector((state) => state.filters);
  const guestJobs = useAppSelector((state) => state.guestJobs.jobs);
  const { isJobFormModalOpen, isDescriptionModalOpen } = useAppSelector((state) => state.ui);

  const { data: apiResponse, error, isLoading, isFetching } = useGetJobsQuery(filters, {
    skip: isGuest || status === 'loading',
  });

  const apiJobs = apiResponse?.data;
  const pagination = apiResponse?.pagination;

  useEffect(() => {
    if (socket) {
      const handleJobsUpdate = () => {
        toast.info('Your job board has been updated.');
        dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: 'LIST' }]));
      };

      socket.on('jobs_updated', handleJobsUpdate);

      return () => {
        socket.off('jobs_updated', handleJobsUpdate);
      };
    }
  }, [socket, dispatch]);

  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  const filteredAndSortedJobs = useMemo(() => {
    const jobs = isGuest ? guestJobs : (apiJobs || []);
    return [...jobs].sort((a, b) => a.order - b.order);
  }, [isGuest, guestJobs, apiJobs]);

  useEffect(() => {
    const isIndeterminate = selectedJobIds.size > 0 && selectedJobIds.size < filteredAndSortedJobs.length;
    if (selectAllCheckboxRef.current) {
        selectAllCheckboxRef.current.dataset.state = isIndeterminate ? 'indeterminate' : (selectedJobIds.size > 0 ? 'checked' : 'unchecked');
    }
  }, [selectedJobIds, filteredAndSortedJobs.length]);

  const handleSelectionChange = (jobId: string, isSelected: boolean) => {
    setSelectedJobIds(prev => {
        const newSet = new Set(prev);
        if (isSelected) newSet.add(jobId);
        else newSet.delete(jobId);
        return newSet;
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) setSelectedJobIds(new Set(filteredAndSortedJobs.map(j => j.id)));
    else setSelectedJobIds(new Set());
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    setSelectedJobIds(new Set());
  };

  const showInitialLoading = (isLoading && !isGuest);
  const hasJobs = filteredAndSortedJobs && filteredAndSortedJobs.length > 0;
  const isFiltered = !!filters.search || (!!filters.status && filters.status !== 'ALL') || !!filters.dateRange || !!filters.salaryMin || !!filters.salaryMax;

  const showPagination = !isGuest && pagination && pagination.totalPages > 1;

  return (
    <>
      <FilterPanel
          selectedIds={Array.from(selectedJobIds)}
          clearSelection={() => setSelectedJobIds(new Set())}
      />
      <div className="flex-1 overflow-hidden">
        {showInitialLoading ? (
            <LoadingState />
        ) : error ? (
            <div className="text-center p-10 text-destructive font-semibold">Error loading jobs. Please refresh.</div>
        ) : hasJobs ? (
            <div className="flex-1 overflow-y-auto pr-1 h-full">
                <div className="sticky top-0 z-10 grid items-center gap-x-4 p-2 border-b bg-muted/50 font-semibold text-sm text-muted-foreground mb-2 rounded-t-lg
                                grid-cols-[auto_40px_1.5fr_1fr_40px]
                                md:grid-cols-[auto_40px_minmax(120px,1.2fr)_minmax(120px,1.2fr)_160px_minmax(100px,1fr)_100px_100px_100px_1fr_1fr_1fr_40px]">
                    <div className="pl-2"> <Checkbox ref={selectAllCheckboxRef} onCheckedChange={handleSelectAll} checked={selectedJobIds.size > 0 && selectedJobIds.size === filteredAndSortedJobs.length}/> </div>
                    <div>{/* Drag handle */}</div>
                    <div><span className="md:hidden">Info</span><span className="hidden md:inline">Company</span></div>
                    <div className="hidden md:block">Position</div>
                    <div className="text-center">Status</div>
                    <div className="hidden md:block">Location</div>
                    <div className="hidden md:block">Applied</div>
                    <div className="hidden md:block">Platform</div>
                    <div className="hidden md:block">Link</div>
                    <div className="hidden md:block">Description</div>
                    <div className="hidden md:block">Resume</div>
                    <div className="hidden md:block">Cover Letter</div>
                    <div className="pr-2 text-right">Actions</div>
                </div>

                {isFetching && !isLoading && (
                    <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Updating...</span>
                    </div>
                )}

                <DragDropContainer jobs={filteredAndSortedJobs} selectedJobIds={selectedJobIds} onSelectionChange={handleSelectionChange}/>

                {showPagination && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4 px-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page <= 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium px-3">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
             <EmptyState isFiltered={isFiltered} isGuest={isGuest} />
        )}

        {isJobFormModalOpen && <JobFormModal />}
        {isDescriptionModalOpen && <DescriptionModal />}
        {showOnboarding && <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />}
      </div>
    </>
  );
}

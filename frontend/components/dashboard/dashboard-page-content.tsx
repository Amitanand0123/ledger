'use client';

import { FilterPanel } from '@/components/dashboard/filter-panel';
import { JobFormModal } from '@/components/dashboard/job-form-modal';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { jobsApiSlice, useGetJobsQuery } from '@/lib/redux/slices/jobsApiSlice';
import { useSession } from 'next-auth/react';
import { useMemo, useRef, useState,useEffect } from 'react';
import { EmptyState } from './empty-state';
import { JobCardSkeleton } from './job-card.skeleton';
import { JobDetailsModal } from './job-details-modal';
import { Loader2 } from 'lucide-react';
import { DragDropContainer } from './drag-drop-container';
import { Checkbox } from '../ui/checkbox';
import { DescriptionModal } from './description-modal';
import { useSocket } from '@/lib/hooks/useSocket';
import { toast } from 'sonner';

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
  const { data: session, status } = useSession();
  const isGuest = status === 'unauthenticated';
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const filters = useAppSelector((state) => state.filters);
  const guestJobs = useAppSelector((state) => state.guestJobs.jobs);
  const { isJobFormModalOpen, isJobDetailsModalOpen, isDescriptionModalOpen } = useAppSelector((state) => state.ui);
  
  const { data: apiJobs, error, isLoading } = useGetJobsQuery(filters, {
    skip: isGuest || status === 'loading',
  });

  // REAL-TIME UPDATE LOGIC
  useEffect(() => {
    if (socket) {
      const handleJobsUpdate = () => {
        toast.info("Your job board has been updated.");
        // Invalidate the 'LIST' tag for the 'Job' type, forcing RTK Query to refetch jobs.
        dispatch(jobsApiSlice.util.invalidateTags([{ type: 'Job', id: 'LIST' }]));
      };

      socket.on('jobs_updated', handleJobsUpdate);

      return () => {
        socket.off('jobs_updated', handleJobsUpdate);
      };
    }
  }, [socket, dispatch]);


  const jobs = isGuest ? guestJobs : (apiJobs || []);
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  const filteredAndSortedJobs = useMemo(() => {
    // Backend handles filtering for authenticated users.
    // For guest users, we could add client-side filtering here if needed.
    return [...jobs].sort((a, b) => a.order - b.order);
  }, [jobs]);
  
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

  const showInitialLoading = (isLoading && !isGuest);
  const hasJobs = filteredAndSortedJobs && filteredAndSortedJobs.length > 0;
  const isFiltered = !!filters.search || (!!filters.status && filters.status !== 'ALL') || !!filters.dateRange || !!filters.salaryMin || !!filters.salaryMax;

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
                <div className="sticky top-0 z-10 grid items-center gap-x-4 p-2 border-b bg-muted/50 font-semibold text-sm text-muted-foreground mb-2 rounded-t-lg text-center
                                grid-cols-[auto_40px_1.5fr_1fr_40px] 
                                md:grid-cols-[auto_40px_minmax(120px,1.2fr)_minmax(120px,1.2fr)_130px_minmax(100px,1fr)_100px_100px_100px_1fr_1fr_1fr_40px]">
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
                <DragDropContainer jobs={filteredAndSortedJobs} selectedJobIds={selectedJobIds} onSelectionChange={handleSelectionChange}/>
            </div>
        ) : (
             <EmptyState isFiltered={isFiltered} isGuest={isGuest} />
        )}
       
        {isJobFormModalOpen && <JobFormModal />}
        {isJobDetailsModalOpen && <JobDetailsModal />}
        {isDescriptionModalOpen && <DescriptionModal />}
      </div>
    </>
  );
}
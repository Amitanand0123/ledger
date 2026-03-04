'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useMemo, useEffect } from 'react';
import { JobCard } from './job-card';
import { createPortal } from 'react-dom';
import { JobApplication } from '@/lib/types';
import { useUpdateJobMutation } from '@/lib/redux/slices/jobsApiSlice';
import { useSession } from 'next-auth/react';
import { updateGuestJob } from '@/lib/redux/slices/guestJobsSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { toast } from 'sonner';

const THEME_COLORS = [
    'bg-blue-50/50 dark:bg-blue-950/20',
    'bg-slate-50/80 dark:bg-slate-800/20',
    'bg-indigo-50/30 dark:bg-indigo-950/20',
    'bg-muted',
];

interface DragDropContainerProps {
  jobs: JobApplication[];
  selectedJobIds: Set<string>;
  onSelectionChange: (jobId: string, isSelected: boolean) => void;
}

export function DragDropContainer({ jobs, selectedJobIds, onSelectionChange }: DragDropContainerProps) {
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);
  const [orderedJobs, setOrderedJobs] = useState(jobs);
  const [mounted, setMounted] = useState(false);
  const [updateJob] = useUpdateJobMutation();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const isGuest = !session;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOrderedJobs(jobs);
  }, [jobs]);

  const jobsId = useMemo(() => orderedJobs.map((job) => job.id), [orderedJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = orderedJobs.find((j) => j.id === active.id);
    if (job) setActiveJob(job);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedJobs.findIndex(j => j.id === active.id);
    const newIndex = orderedJobs.findIndex(j => j.id === over.id);

    if (oldIndex !== newIndex) {
        const reorderedJobs = arrayMove(orderedJobs, oldIndex, newIndex);
        setOrderedJobs(reorderedJobs);

        // Capture correct order index BEFORE filtering, then filter for changed items
        const updates = reorderedJobs
            .map((job, index) => ({ job, newOrder: index }))
            .filter(({ job, newOrder }) => job.order !== newOrder)
            .map(({ job, newOrder }) => {
                if (isGuest) {
                    dispatch(updateGuestJob({ id: job.id, order: newOrder }));
                    return Promise.resolve();
                } else {
                    return updateJob({ id: job.id, order: newOrder }).unwrap();
                }
            });

        // Execute all updates in parallel with proper error handling
        try {
            await Promise.all(updates);
        } catch (error) {
            console.error('Failed to update job order:', error);
            toast.error('Failed to update job order. Please refresh the page.');
            // Revert to original order on error
            setOrderedJobs(jobs);
        }
    }
  };

  return (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={jobsId} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                colorClass={THEME_COLORS[index % THEME_COLORS.length]}
                isSelected={selectedJobIds.has(job.id)}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </div>
        </SortableContext>

        {mounted && createPortal(
            <DragOverlay>
                {activeJob && (
                    <div className="w-full">
                         <JobCard
                            job={activeJob}
                            isOverlay
                            colorClass="bg-card"
                            isSelected={false}
                            onSelectionChange={() => {}}
                         />
                    </div>
                )}
            </DragOverlay>,
            document.body,
        )}
      </DndContext>
  );
}

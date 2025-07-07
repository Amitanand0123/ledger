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

// Color Workaround: Define colors directly as Tailwind classes
const THEME_COLORS = [
    'bg-[#8DBCC7]/5 dark:bg-[#8DBCC7]/10', // brand-primary
    'bg-[#A4CCD9]/5 dark:bg-[#A4CCD9]/10', // brand-secondary
    'bg-[#C4E1E6]/20 dark:bg-[#C4E1E6]/10', // brand-accent-light
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
  const [updateJob] = useUpdateJobMutation();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const isGuest = !session;

  useEffect(() => {
    setOrderedJobs(jobs);
  }, [jobs]);

  const jobsId = useMemo(() => orderedJobs.map((job) => job.id), [orderedJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = orderedJobs.find((j) => j.id === active.id);
    if (job) setActiveJob(job);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedJobs.findIndex(j => j.id === active.id);
    const newIndex = orderedJobs.findIndex(j => j.id === over.id);

    if (oldIndex !== newIndex) {
        const reorderedJobs = arrayMove(orderedJobs, oldIndex, newIndex);
        setOrderedJobs(reorderedJobs);
        
        reorderedJobs.forEach((job, index) => {
            if (job.order !== index) {
                if (isGuest) {
                    dispatch(updateGuestJob({ id: job.id, order: index }));
                } else {
                    updateJob({ id: job.id, order: index });
                }
            }
        });
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

        {createPortal(
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
            document.body
        )}
      </DndContext>
  );
}
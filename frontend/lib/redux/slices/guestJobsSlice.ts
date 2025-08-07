import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { JobApplication } from '@/lib/types';
import { arrayMove } from '@dnd-kit/sortable';

interface GuestJobsState {
    jobs: JobApplication[];
}

const demoJobs: JobApplication[] = [
    { id: nanoid(), company: 'Innovate LLC', position: 'Full Stack Engineer', location: 'New York, NY', status: 'Interview 1', order: 0, applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), userId: 'guest', salary: '$140,000/year', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: nanoid(), company: 'DemoCorp', position: 'Frontend Developer', location: 'Remote', status: 'Pending', order: 1, applicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), userId: 'guest', salary: '$125,000/year', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: nanoid(), company: 'DataSolutions', position: 'Data Analyst', location: 'Chicago, IL', status: 'OA', order: 2, applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), userId: 'guest', salary: '$95,000/year', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialState: GuestJobsState = {
    jobs: demoJobs,
};

const guestJobsSlice = createSlice({
    name: 'guestJobs',
    initialState,
    reducers: {
        addGuestJob: (state, action: PayloadAction<Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order' | 'applicationDate'>>) => {
            const newJob: JobApplication = {
                ...action.payload,
                id: nanoid(),
                userId: 'guest',
                order: state.jobs.length,
                applicationDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new  Date().toISOString(),
            };
            state.jobs.push(newJob);
        },
        updateGuestJob: (state, action: PayloadAction<Partial<JobApplication> & { id: string }>) => {
            const { id, ...updates } = action.payload;
            const jobIndex = state.jobs.findIndex(job => job.id === id);
            
            if (jobIndex !== -1) {
                const originalJob = state.jobs[jobIndex];
                if (updates.order !== undefined && Object.keys(updates).length === 2) {
                    const reorderedJobs = arrayMove(state.jobs, jobIndex, updates.order);
                    state.jobs = reorderedJobs.map((job, index) => ({ ...job, order: index }));
                } else {
                    Object.assign(originalJob, updates, { updatedAt: new Date().toISOString() });
                }
            }
        },
        deleteGuestJob: (state, action: PayloadAction<string>) => {
            state.jobs = state.jobs.filter(job => job.id !== action.payload);
        },
    },
});

export const { addGuestJob, updateGuestJob, deleteGuestJob } = guestJobsSlice.actions;
export default guestJobsSlice.reducer;
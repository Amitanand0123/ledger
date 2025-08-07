import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';
import { JobApplication, Status } from '@/lib/types';

type GetJobsQueryArgs = {
    search?: string;
    location?: string;
    dateRange?: string; // Expects JSON string of date range object
    status?: string;
    salaryMin?: string;
    salaryMax?: string;
}

export const jobsApiSlice = createApi({
  reducerPath: 'jobsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/`,
    prepareHeaders: async (headers) => {
      const session = await getSession();
      if (session?.accessToken) {
        headers.set('authorization', `Bearer ${session.accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    getJobs: builder.query<JobApplication[], GetJobsQueryArgs | void>({
      query: (args) => {
          const params = new URLSearchParams();
          if (args) {
            if (args.search) params.append('search', args.search);
            if (args.location) params.append('location', args.location);
            if (args.status && args.status !== 'ALL') params.append('status', args.status);
            if (args.dateRange) {
                const range = JSON.parse(args.dateRange);
                if (range.from) params.append('startDate', new Date(range.from).toISOString());
                if (range.to) params.append('endDate', new Date(range.to).toISOString());
            }
            if (args.salaryMin) params.append('salaryMin', args.salaryMin);
            if (args.salaryMax) params.append('salaryMax', args.salaryMax);
          }
          return `jobs?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [ ...result.map(({ id }) => ({ type: 'Job' as const, id })), { type: 'Job', id: 'LIST' }]
          : [{ type: 'Job', id: 'LIST' }],
    }),
    
    addJob: builder.mutation<JobApplication, Partial<JobApplication>>({
      query: (body) => ({ url: 'jobs', method: 'POST', body }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    updateJob: builder.mutation<JobApplication, Partial<JobApplication> & Pick<JobApplication, 'id'>>({
      query: ({ id, ...patch }) => ({ url: `jobs/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }],
    }),

    deleteJob: builder.mutation<{ id: string }, string>({
        query: (id) => ({ url: `jobs/${id}`, method: 'DELETE' }),
        invalidatesTags: (result, error, id) => [{ type: 'Job', id: 'LIST' }],
    }),
    analyzeJobMatch: builder.mutation<any, { jobId: string, resumeId: string }>({
        query: ({ jobId, resumeId }) => ({
            url: `jobs/${jobId}/match-analysis`,
            method: 'POST',
            body: { resumeId },
        }),
    }),
    findSimilarJobs: builder.query<JobApplication[], string>({
        query: (jobId) => `jobs/${jobId}/similar`,
    }),
    
    // NOTE: A true bulk delete would be a single API call. 
    // This hook is not used directly; we loop over the single delete mutation for simplicity.
    // A production app should have a `DELETE /jobs` endpoint that accepts an array of IDs.
  }),
});

export const { useGetJobsQuery, useAddJobMutation, useUpdateJobMutation, useDeleteJobMutation, useAnalyzeJobMatchMutation, useFindSimilarJobsQuery } = jobsApiSlice;
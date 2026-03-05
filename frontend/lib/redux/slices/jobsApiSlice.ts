import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';
import { JobApplication, PaginatedResponse, Status } from '@/lib/types';

type GetJobsQueryArgs = {
    search?: string;
    location?: string;
    dateRange?: string;
    status?: string;
    salaryMin?: string;
    salaryMax?: string;
    page?: number;
    limit?: number;
}

export const jobsApiSlice = createApi({
  reducerPath: 'jobsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/`,
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
    getJobs: builder.query<PaginatedResponse<JobApplication>, GetJobsQueryArgs | void>({
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
            if (args.page) params.append('page', args.page.toString());
            if (args.limit) params.append('limit', args.limit.toString());
          }
          return `jobs?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: JobApplication[]; pagination: any }) => ({
        data: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result
          ? [ ...result.data.map(({ id }) => ({ type: 'Job' as const, id })), { type: 'Job', id: 'LIST' }]
          : [{ type: 'Job', id: 'LIST' }],
    }),

    addJob: builder.mutation<JobApplication, Partial<JobApplication>>({
      query: (body) => ({ url: 'jobs', method: 'POST', body }),
      transformResponse: (response: { success: boolean; data: JobApplication }) => response.data,
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    updateJob: builder.mutation<JobApplication, Partial<JobApplication> & Pick<JobApplication, 'id'>>({
      query: ({ id, ...patch }) => ({ url: `jobs/${id}`, method: 'PUT', body: patch }),
      transformResponse: (response: { success: boolean; data: JobApplication }) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }],
    }),

    deleteJob: builder.mutation<{ id: string }, string>({
        query: (id) => ({ url: `jobs/${id}`, method: 'DELETE' }),
        transformResponse: (response: { success: boolean; data: { id: string } }) => response.data,
        invalidatesTags: (result, error, id) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }],
    }),
    analyzeJobMatch: builder.mutation<any, { jobId: string, resumeId: string }>({
        query: ({ jobId, resumeId }) => ({
            url: `jobs/${jobId}/match-analysis`,
            method: 'POST',
            body: { resumeId },
        }),
        transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    getJobById: builder.query<JobApplication, string>({
      query: (id) => `jobs/${id}`,
      transformResponse: (response: { success: boolean; data: JobApplication }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
  }),
});

export const { useGetJobsQuery, useGetJobByIdQuery, useAddJobMutation, useUpdateJobMutation, useDeleteJobMutation, useAnalyzeJobMatchMutation } = jobsApiSlice;

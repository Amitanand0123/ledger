import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';
import {UserDocument} from '@/lib/types';

interface AgentRequest {
    resumeId: string;
    jobId: string;
    userGoal: string;
}

interface AgentResponse {
    recommendation: string;
}

interface RebuildResponse {
    message: string;
    newDocument: UserDocument;
}

export const agentApiSlice = createApi({
  reducerPath: 'agentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/` : '/api/v1/',
    prepareHeaders: async (headers) => {
      const session = await getSession();
      if (session?.accessToken) headers.set('authorization', `Bearer ${session.accessToken}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    invokeAgent: builder.mutation<AgentResponse, AgentRequest>({
      query: (body) => ({
        url: 'agent/invoke',
        method: 'POST',
        body,
      }),
    }),
    rebuildResume: builder.mutation<RebuildResponse, { jobId: string; resumeId: string }>({
        query: (body) => ({
            url: 'agent/rebuild-resume',
            method: 'POST',
            body,
        }),
    }),
  }),
});

export const { useInvokeAgentMutation, useRebuildResumeMutation  } = agentApiSlice;
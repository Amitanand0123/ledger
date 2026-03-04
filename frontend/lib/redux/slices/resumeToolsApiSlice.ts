import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';
import { UserDocument } from '@/lib/types';

interface ExtractJobResponse {
    position: string;
    company: string;
    location: string;
    description: string;
}

interface ScoreResumeResponse {
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    suggestions: string;
}

interface RebuildResumeResponse {
    message: string;
    newDocument: UserDocument;
}

export const resumeToolsApiSlice = createApi({
    reducerPath: 'resumeToolsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/` : '/api/v1/',
        prepareHeaders: async (headers) => {
            const session = await getSession();
            if (session?.accessToken) headers.set('authorization', `Bearer ${session.accessToken}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        extractJobFromUrl: builder.mutation<ExtractJobResponse, { url: string }>({
            query: (body) => ({
                url: 'ai/extract-job-url',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: boolean; data: ExtractJobResponse }) => response.data,
        }),
        scoreResume: builder.mutation<ScoreResumeResponse, { resumeId: string; jobDescription: string }>({
            query: (body) => ({
                url: 'ai/score-resume',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: boolean; data: ScoreResumeResponse }) => response.data,
        }),
        rebuildResumeStandalone: builder.mutation<RebuildResumeResponse, { resumeId: string; jobDescription: string }>({
            query: (body) => ({
                url: 'ai/rebuild-resume',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: boolean; data: RebuildResumeResponse }) => response.data,
        }),
    }),
});

export const {
    useExtractJobFromUrlMutation,
    useScoreResumeMutation,
    useRebuildResumeStandaloneMutation,
} = resumeToolsApiSlice;

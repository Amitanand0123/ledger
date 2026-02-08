import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

export const userApiSlice = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/` : '/api/v1/',
    prepareHeaders: async (headers) => {
      const session = await getSession();
      if (session?.accessToken) {
        headers.set('authorization', `Bearer ${session.accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Stats'],
  endpoints: (builder) => ({
    getAdvancedStats: builder.query<any, void>({
      query: () => 'users/stats/advanced',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Stats'],
    }),
    updateWebhookSettings: builder.mutation<any, { eventType: string, targetUrl: string }>({
        query: (body) => ({
            url: 'users/settings/webhook',
            method: 'PUT',
            body,
        }),
        transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
    completeOnboarding: builder.mutation<any, void>({
        query: () => ({
            url: 'users/onboarding/complete',
            method: 'POST',
        }),
        transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),
  }),
});

export const { useGetAdvancedStatsQuery, useUpdateWebhookSettingsMutation, useCompleteOnboardingMutation } = userApiSlice;
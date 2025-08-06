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
      providesTags: ['Stats'],
    }),
    updateAirtableSettings: builder.mutation<any, { apiKey: string, baseId: string, tableName: string }>({
        query: (body) => ({
            url: `users/settings/airtable`,
            method: 'PUT',
            body,
        }),
    }),
    syncToAirtable: builder.mutation<{ message: string }, void>({
        query: () => ({
            url: `users/settings/airtable/sync`,
            method: 'POST',
        }),
    }),
    updateWebhookSettings: builder.mutation<any, { eventType: string, targetUrl: string }>({
        query: (body) => ({
            url: `users/settings/webhook`,
            method: 'PUT',
            body,
        })
    }),
    getGoogleAuthUrl: builder.mutation<{ url: string }, void>({
        query: () => ({
            url: `gcal/auth-url`,
            method: 'GET', // Although it's a mutation from the client's perspective, it hits a GET endpoint
        }),
    }),
  }),
});

export const { useGetAdvancedStatsQuery,useUpdateAirtableSettingsMutation, useSyncToAirtableMutation, useUpdateWebhookSettingsMutation,
useGetGoogleAuthUrlMutation,
  } = userApiSlice;
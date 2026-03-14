import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

export const statsApiSlice = createApi({
  reducerPath: 'statsApi',
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
    getStats: builder.query<any, void>({
      query: () => 'users/stats',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: [{ type: 'Stats', id: 'summary' }],
      keepUnusedDataFor: 60,
    }),
    getOverviewStats: builder.query<any, number>({
      query: (days) => `users/stats/overview?days=${days}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: (_result, _error, days) => [{ type: 'Stats', id: `overview-${days}` }],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetStatsQuery, useGetOverviewStatsQuery } = statsApiSlice;
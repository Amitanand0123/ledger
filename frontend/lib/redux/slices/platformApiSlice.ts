import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';
import { JobPlatform } from '@/lib/types';

export const platformApiSlice = createApi({
  reducerPath: 'platformApi',
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
  tagTypes: ['Platform'],
  endpoints: (builder) => ({
    getPlatforms: builder.query<JobPlatform[], string | void>({
      query: (search) => `platforms${search ? `?search=${search}` : ''}`,
      transformResponse: (response: { success: boolean; data: JobPlatform[] }) => response.data,
      providesTags: ['Platform'],
    }),
  }),
});

export const { useGetPlatformsQuery } = platformApiSlice;
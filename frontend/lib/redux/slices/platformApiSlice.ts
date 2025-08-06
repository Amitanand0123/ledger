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
      providesTags: ['Platform'],
    }),
    // The creation is handled implicitly by the backend when a job is created
    // with a new platformName, so we only need to invalidate the list.
    // This is handled by invalidating the 'Job' LIST tag which causes a dashboard refresh.
  }),
});

export const { useGetPlatformsQuery } = platformApiSlice;
// frontend/lib/redux/slices/sharingApiSlice.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

export interface Share {
    id: string;
    inviteEmail: string;
    viewer:{
        name: string | null;
        email: string;
    } | null;
}

export const sharingApiSlice = createApi({
  reducerPath: 'sharingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/`,
    prepareHeaders: async (headers) => {
      const session = await getSession();
      if (session?.accessToken) headers.set('authorization', `Bearer ${session.accessToken}`);
      return headers;
    },
  }),
  tagTypes: ['Share'],
  endpoints: (builder) => ({
    getMySharedUsers: builder.query<Share[], void>({
      query: () => 'shares',
      transformResponse: (response: { success: boolean; data: Share[] }) => response.data,
      providesTags: ['Share'],
    }),
    shareDashboard: builder.mutation<Share, { email: string }>({
      query: (body) => ({ url: 'shares', method: 'POST', body }),
      transformResponse: (response: { success: boolean; data: Share }) => response.data,
      invalidatesTags: ['Share'],
    }),
    revokeShareAccess: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `shares/${id}`, method: 'DELETE' }),
      transformResponse: (response: { success: boolean; data: { id: string } }) => response.data,
      invalidatesTags: ['Share'],
    }),
  }),
});

export const { useGetMySharedUsersQuery, useShareDashboardMutation, useRevokeShareAccessMutation } = sharingApiSlice;
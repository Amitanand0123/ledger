import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

interface CustomField {
    id: string;
    name: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
    userId: string;
}

export const customFieldsApiSlice = createApi({
  reducerPath: 'customFieldsApi',
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
  tagTypes: ['CustomField'],
  endpoints: (builder) => ({
    getCustomFields: builder.query<CustomField[], void>({
      query: () => 'custom-fields',
      transformResponse: (response: { success: boolean; data: CustomField[] }) => response.data,
      providesTags: ['CustomField'],
    }),

    addCustomField: builder.mutation<CustomField, { name: string; type: string }>({
      query: (body) => ({
        url: 'custom-fields',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: CustomField }) => response.data,
      invalidatesTags: ['CustomField'],
    }),

    deleteCustomField: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `custom-fields/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; data: { id: string } }) => response.data,
      invalidatesTags: ['CustomField'],
    }),
  }),
});
export const { useGetCustomFieldsQuery, useAddCustomFieldMutation, useDeleteCustomFieldMutation } = customFieldsApiSlice;
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

// Define the expected shape of a Custom Field object
interface CustomField {
    id: string;
    name: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN';
    userId: string;
}

// Create the API slice
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
  // Define a tag for cache invalidation
  tagTypes: ['CustomField'],
  endpoints: (builder) => ({
    // Endpoint to get all custom fields for the logged-in user
    getCustomFields: builder.query<CustomField[], void>({
      query: () => 'custom-fields',
      providesTags: ['CustomField'],
    }),

    // Mutation to add a new custom field
    addCustomField: builder.mutation<CustomField, { name: string; type: string }>({
      query: (body) => ({
        url: 'custom-fields',
        method: 'POST',
        body,
      }),
      // When a field is added, invalidate the cache to refetch the list
      invalidatesTags: ['CustomField'],
    }),

    // Mutation to delete a custom field
    deleteCustomField: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `custom-fields/${id}`,
        method: 'DELETE',
      }),
      // When a field is deleted, invalidate the cache to refetch the list
      invalidatesTags: ['CustomField'],
    }),
  }),
});

// Export the auto-generated hooks
export const { useGetCustomFieldsQuery, useAddCustomFieldMutation, useDeleteCustomFieldMutation } = customFieldsApiSlice;
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

export interface UserDocument {
    id: string;
    filename: string;
    fileKey: string;
    type: 'RESUME' | 'COVER_LETTER';
    createdAt: string;
    latexSource?: string | null;
}

export const documentApiSlice = createApi({
    reducerPath: 'documentApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/`,
        prepareHeaders: async (headers) => {
            const session = await getSession();
            if (session?.accessToken) {
                headers.set('authorization', `Bearer ${session.accessToken}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Document'],
    endpoints: (builder) => ({
        getDocuments: builder.query<UserDocument[], 'RESUME' | 'COVER_LETTER' | undefined>({
            query: (type) => `documents${type ? `?type=${type}` : ''}`,
            transformResponse: (response: { success: boolean; data: UserDocument[] }) => response.data,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Document' as const, id })), { type: 'Document', id: 'LIST' }]
                    : [{ type: 'Document', id: 'LIST' }],
            keepUnusedDataFor: 60,
        }),
        deleteDocument: builder.mutation<{ id: string }, string>({
            query: (id) => ({
                url: `documents/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response: { success: boolean; data: { id: string } }) => response.data,
            invalidatesTags: [{ type: 'Document', id: 'LIST' }],
        }),
        createDocument: builder.mutation<UserDocument, { filename: string; fileKey: string; type: 'RESUME' | 'COVER_LETTER'; latexSource?: string }>({
            query: (body) => ({
                url: 'documents',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: boolean; data: UserDocument }) => response.data,
            invalidatesTags: [{ type: 'Document', id: 'LIST' }],
        }),
    }),
});

export const { useGetDocumentsQuery, useDeleteDocumentMutation, useCreateDocumentMutation } = documentApiSlice;
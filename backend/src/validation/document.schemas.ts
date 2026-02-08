import { z } from 'zod';

/**
 * Valid document type values
 */
const DocumentTypeEnum = z.enum(['RESUME', 'COVER_LETTER']);

/**
 * Schema for creating a document
 */
export const createDocumentSchema = z.object({
    body: z.object({
        filename: z.string().min(1, 'Filename is required'),
        fileKey: z.string().min(1, 'File key is required'),
        type: DocumentTypeEnum,
        latexSource: z.string().optional(),
    }).strict(),
});

/**
 * Schema for getting a document
 */
export const getDocumentSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid document ID'),
    }),
});

/**
 * Schema for deleting a document
 */
export const deleteDocumentSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid document ID'),
    }),
});

/**
 * Schema for getting document download URL
 */
export const getDocumentDownloadUrlSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid document ID'),
    }),
});

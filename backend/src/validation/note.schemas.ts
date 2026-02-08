import { z } from 'zod';

/**
 * Schema for creating a note
 */
export const createNoteSchema = z.object({
    body: z.object({
        jobId: z.string().cuid2('Invalid job ID'),
        content: z.string().min(1, 'Note content is required'),
        isPinned: z.boolean().optional(),
    }).strict(),
});

/**
 * Schema for updating a note
 */
export const updateNoteSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid note ID'),
    }),
    body: z.object({
        content: z.string().min(1, 'Note content is required').optional(),
        isPinned: z.boolean().optional(),
    }).strict(),
});

/**
 * Schema for getting a note
 */
export const getNoteSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid note ID'),
    }),
});

/**
 * Schema for deleting a note
 */
export const deleteNoteSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid note ID'),
    }),
});

/**
 * Schema for getting notes by job
 */
export const getNotesByJobSchema = z.object({
    params: z.object({
        jobId: z.string().cuid2('Invalid job ID'),
    }),
});

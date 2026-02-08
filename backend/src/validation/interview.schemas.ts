import { z } from 'zod';

/**
 * Valid interview type values
 */
const InterviewTypeEnum = z.enum([
    'PHONE_SCREEN',
    'TECHNICAL',
    'BEHAVIORAL',
    'SYSTEM_DESIGN',
    'CULTURAL_FIT',
    'FINAL_ROUND',
    'OTHER',
]);

/**
 * Schema for creating an interview
 */
export const createInterviewSchema = z.object({
    body: z.object({
        jobId: z.string().cuid2('Invalid job ID'),
        type: InterviewTypeEnum,
        scheduledAt: z.string().datetime('Invalid date format'),
        duration: z.number().int().positive('Duration must be a positive number').optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        completed: z.boolean().optional(),
    }).strict(),
});

/**
 * Schema for updating an interview
 */
export const updateInterviewSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid interview ID'),
    }),
    body: z.object({
        type: InterviewTypeEnum.optional(),
        scheduledAt: z.string().datetime('Invalid date format').optional(),
        duration: z.number().int().positive('Duration must be a positive number').optional().nullable(),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        completed: z.boolean().optional(),
    }).strict(),
});

/**
 * Schema for getting an interview
 */
export const getInterviewSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid interview ID'),
    }),
});

/**
 * Schema for deleting an interview
 */
export const deleteInterviewSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid interview ID'),
    }),
});

/**
 * Schema for getting interviews by job
 */
export const getInterviewsByJobSchema = z.object({
    params: z.object({
        jobId: z.string().cuid2('Invalid job ID'),
    }),
});

/**
 * Schema for getting upcoming interviews
 */
export const getUpcomingInterviewsSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

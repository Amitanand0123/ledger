import { z } from 'zod';

/**
 * Valid job status values
 */
const JobStatusEnum = z.enum([
    'INTERESTED',
    'PREPARING',
    'READY_TO_APPLY',
    'APPLIED',
    'OA',
    'INTERVIEW',
    'OFFER',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
]);

/**
 * Schema for creating a job application
 */
export const createJobSchema = z.object({
    body: z.object({
        company: z.string().min(1, 'Company name is required'),
        position: z.string().min(1, 'Position is required'),
        location: z.string().min(1, 'Location is required'),
        salary: z.string().optional(),
        salaryMin: z.number().int().positive().optional(),
        salaryMax: z.number().int().positive().optional(),
        url: z.string().url('Invalid URL').optional().or(z.literal('')),
        description: z.string().optional(),
        summary: z.string().optional(),
        // Allow date strings (YYYY-MM-DD) or datetime strings
        deadline: z.string()
            .transform((val) => {
                if (!val) return undefined;
                // If it's just a date (YYYY-MM-DD), convert to datetime at midnight UTC
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                    return new Date(val + 'T00:00:00.000Z').toISOString();
                }
                return val;
            })
            .optional()
            .nullable(),
        status: JobStatusEnum.optional(),
        order: z.number().int().optional(),
        // Accept CUID2 string, null, undefined, or empty string
        platformId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
        platformName: z.string().optional().nullable(), // Allow platformName for frontend compatibility
        // Accept CUID2 string, null, undefined, or empty string
        resumeId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
        coverLetterId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
    }).strict(), // No unknown fields allowed
});

/**
 * Schema for updating a job application
 */
export const updateJobSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid job ID'),
    }),
    body: z.object({
        company: z.string().min(1).optional(),
        position: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
        salary: z.string().optional(),
        salaryMin: z.number().int().positive().optional(),
        salaryMax: z.number().int().positive().optional(),
        url: z.string().url('Invalid URL').optional().or(z.literal('')),
        description: z.string().optional(),
        summary: z.string().optional(),
        // Allow date strings (YYYY-MM-DD) or datetime strings
        deadline: z.string()
            .transform((val) => {
                if (!val) return undefined;
                // If it's just a date (YYYY-MM-DD), convert to datetime at midnight UTC
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                    return new Date(val + 'T00:00:00.000Z').toISOString();
                }
                return val;
            })
            .optional()
            .nullable(),
        status: JobStatusEnum.optional(),
        order: z.number().int().optional(),
        // Accept CUID2 string, null, undefined, or empty string
        platformId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
        platformName: z.string().optional().nullable(), // Allow platformName for frontend compatibility
        // Accept CUID2 string, null, undefined, or empty string
        resumeId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
        coverLetterId: z.union([
            z.string().cuid2(),
            z.literal(''),
            z.null(),
            z.undefined(),
        ]).optional(),
    }).strict(),
});

/**
 * Schema for getting a single job
 */
export const getJobSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid job ID'),
    }),
});

/**
 * Schema for deleting a job
 */
export const deleteJobSchema = z.object({
    params: z.object({
        id: z.string().cuid2('Invalid job ID'),
    }),
});

/**
 * Schema for bulk job operations
 */
export const bulkUpdateJobsSchema = z.object({
    body: z.object({
        jobIds: z.array(z.string().cuid2()).min(1, 'At least one job ID is required'),
        updates: z.object({
            status: JobStatusEnum.optional(),
            order: z.number().int().optional(),
        }),
    }),
});

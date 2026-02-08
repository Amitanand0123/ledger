import { db } from '../db/client.js';
import {
    jobApplications,
    statusHistory,
    jobPlatforms,
    documents,
    interviews,
    notes,
    users,
    jobStatusEnum,
} from '../db/schema/index.js';
import { eq, and, or, gte, lte, ilike, asc, desc, inArray, notInArray, SQL, sql } from 'drizzle-orm';
import app from '../app.js';
import { parseSalary } from '../utils/salaryParser.js';
import { sendEmail } from './email.service.js';
import { createPlatform } from './platform.service.js';
import { getTextFromS3 } from './s3.service.js';
import config from '../config/index.js';
import { logger } from '@/utils/logger.js';
import { NotFoundError, ForbiddenError, ValidationError } from '@/utils/ApiError.js';

const onJobDataChange = (userId: string) => {
    const io = app.get('io');
    if (io) {
        const eventName = 'jobs_updated';
        io.to(userId).emit(eventName, { userId });
    }
};

type JobFilters = {
    search?: string;
    status?: string;
    location?: string;
    salaryMin?: string;
    salaryMax?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
};

export const getAllJobs = async (userId: string, filters: JobFilters = {}) => {
    const conditions: SQL[] = [eq(jobApplications.userId, userId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(jobApplications.company, `%${filters.search}%`),
                ilike(jobApplications.position, `%${filters.search}%`)
            )!
        );
    }

    if (filters.status && filters.status !== 'ALL') {
        conditions.push(eq(jobApplications.status, filters.status as any));
    }

    if (filters.location) {
        conditions.push(ilike(jobApplications.location, `%${filters.location}%`));
    }

    if (filters.salaryMin) {
        conditions.push(gte(jobApplications.salaryMin, parseInt(filters.salaryMin, 10)));
    }

    if (filters.salaryMax) {
        conditions.push(lte(jobApplications.salaryMax, parseInt(filters.salaryMax, 10)));
    }

    if (filters.startDate) {
        conditions.push(gte(jobApplications.applicationDate, new Date(filters.startDate)));
    }

    if (filters.endDate) {
        conditions.push(lte(jobApplications.applicationDate, new Date(filters.endDate)));
    }

    const whereClause = and(...conditions);

    const page = Math.max(1, parseInt(filters.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit || '20', 10) || 20));
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
        db.query.jobApplications.findMany({
            where: whereClause,
            orderBy: asc(jobApplications.order),
            limit,
            offset,
            with: {
                platform: true,
                resume: true,
                coverLetter: true,
                interviews: {
                    orderBy: asc(interviews.scheduledAt),
                },
                notes: {
                    orderBy: [desc(notes.isPinned), desc(notes.createdAt)],
                },
            },
        }),
        db.select({ count: sql<number>`count(*)` }).from(jobApplications).where(whereClause!),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getJobById = async (jobId: string, userId: string) => {
    const job = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, jobId),
        with: {
            platform: true,
            resume: true,
            coverLetter: true,
            interviews: {
                orderBy: asc(interviews.scheduledAt),
            },
            notes: {
                orderBy: [desc(notes.isPinned), desc(notes.createdAt)],
            },
            statusHistory: {
                orderBy: asc(statusHistory.changedAt),
            },
        },
    });

    if (!job) throw new NotFoundError('Job');
    if (job.userId !== userId) throw new ForbiddenError('You do not own this job application.');
    return job;
};

export const createJob = async (userId: string, data: any) => {
    const { salary, platformName, deadline, ...restOfData } = data;
    const { min, max } = parseSalary(salary);

    let platformId = null;
    if (platformName) {
        const platform = await createPlatform(platformName);
        platformId = platform.id;
    }

    // Create job using transaction
    const newJob = await db.transaction(async (tx) => {
        const [job] = await tx
            .insert(jobApplications)
            .values({
                ...restOfData,
                salary,
                deadline: deadline ? new Date(deadline) : null,
                salaryMin: min,
                salaryMax: max,
                userId,
                platformId,
            })
            .returning();

        // Create initial status history
        await tx.insert(statusHistory).values({
            jobId: job.id,
            status: data.status || 'INTERESTED',
        });

        // Fetch job with all relations
        return tx.query.jobApplications.findFirst({
            where: eq(jobApplications.id, job.id),
            with: {
                platform: true,
                resume: true,
                coverLetter: true,
                interviews: {
                    orderBy: asc(interviews.scheduledAt),
                },
                notes: {
                    orderBy: [desc(notes.isPinned), desc(notes.createdAt)],
                },
            },
        });
    });

    if (newJob && newJob.description) {
        embedJobDescription(newJob.id, newJob.description, newJob.userId);
    }

    onJobDataChange(userId);
    return newJob;
};

export const updateJob = async (jobId: string, userId: string, data: any) => {
    const jobToUpdate = await getJobById(jobId, userId);

    if (data.description && data.summary) {
        delete data.description;
    }

    const { platformName, resumeId, coverLetterId, deadline, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (deadline !== undefined) {
        updateData.deadline = deadline ? new Date(deadline) : null;
    }

    if (platformName) {
        const platform = await createPlatform(platformName);
        updateData.platformId = platform.id;
    } else if (platformName === '' || platformName === null) {
        updateData.platformId = null;
    }

    if (resumeId) {
        updateData.resumeId = resumeId;
    } else if (resumeId === null) {
        updateData.resumeId = null;
    }

    if (coverLetterId) {
        updateData.coverLetterId = coverLetterId;
    } else if (coverLetterId === null) {
        updateData.coverLetterId = null;
    }

    if (data.salary) {
        const { min, max } = parseSalary(data.salary);
        updateData.salaryMin = min;
        updateData.salaryMax = max;
    }

    // Handle status change and create status history
    if (data.status && data.status !== jobToUpdate.status) {
        await db.insert(statusHistory).values({
            jobId,
            status: data.status,
        });

        const [user] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (user && (data.status === 'INTERVIEW' || data.status === 'ACCEPTED')) {
            const subject =
                data.status === 'ACCEPTED' ? `Congratulations on your new role!` : `You have an interview!`;
            const textBody = `Your application for ${jobToUpdate.position} at ${jobToUpdate.company} is now: ${data.status}.`;
            // Fire-and-forget email with error handling
            sendEmail({ to: user.email, subject, text: textBody, html: `<p>${textBody}</p>` }).catch((error) =>
                logger.error(`Failed to send status update email to ${user.email}:`, error)
            );
        }
    }

    const [updatedJob] = await db
        .update(jobApplications)
        .set(updateData)
        .where(eq(jobApplications.id, jobId))
        .returning();

    // Fetch with relations
    const jobWithRelations = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, jobId),
        with: {
            platform: true,
            resume: true,
            coverLetter: true,
        },
    });

    if (data.description && data.description !== jobToUpdate.description) {
        embedJobDescription(updatedJob.id, updatedJob.description!, updatedJob.userId);
    }

    onJobDataChange(userId);
    return jobWithRelations;
};

export const deleteJob = async (jobId: string, userId: string) => {
    await getJobById(jobId, userId); // Validates ownership
    const [deletedJob] = await db.delete(jobApplications).where(eq(jobApplications.id, jobId)).returning();
    onJobDataChange(userId);
    return deletedJob;
};

export const deleteBulk = async (ids: string[], userId: string) => {
    const result = await db
        .delete(jobApplications)
        .where(and(inArray(jobApplications.id, ids), eq(jobApplications.userId, userId)))
        .returning();

    onJobDataChange(userId);
    return { count: result.length };
};

export const analyzeMatch = async (userId: string, jobId: string, resumeId: string) => {
    const job = await getJobById(jobId, userId);
    if (!job.description) throw new ValidationError('Job has no description');

    const [resumeDoc] = await db
        .select()
        .from(documents)
        .where(
            and(eq(documents.id, resumeId), eq(documents.userId, userId), eq(documents.type, 'RESUME'))
        )
        .limit(1);

    if (!resumeDoc) throw new NotFoundError('Resume');

    const resumeText = await getTextFromS3(resumeDoc.fileKey);
    if (!resumeText) throw new ValidationError('Could not read resume file content');

    const resumeAnalysisRes = await fetch(`${config.aiServiceUrl}/analyze-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({ resume_text: resumeText }),
    });
    if (!resumeAnalysisRes.ok) {
        const error = await resumeAnalysisRes.json();
        throw new Error(`AI service failed to analyze resume: ${error.detail}`);
    }
    const resumeAnalysis = await resumeAnalysisRes.json();

    const matchAnalysisRes = await fetch(`${config.aiServiceUrl}/match-resume-to-job`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({
            resume_analysis: resumeAnalysis,
            job_description_text: job.description,
        }),
    });
    if (!matchAnalysisRes.ok) {
        const error = await matchAnalysisRes.json();
        throw new Error(`AI service failed to match job: ${error.detail}`);
    }
    const matchAnalysis = await matchAnalysisRes.json();

    return matchAnalysis;
};

async function embedJobDescription(jobId: string, description: string, userId: string) {
    try {
        logger.info(`Embedding job description for job ${jobId}, user ${userId}`);

        const { retryWithBackoff } = await import('../utils/retry.js');

        await retryWithBackoff(
            async () => {
                const response = await fetch(`${config.aiServiceUrl}/embed-job`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.aiServiceApiKey}`,
                    },
                    body: JSON.stringify({
                        job_id: jobId,
                        job_description: description,
                        user_id: userId,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Embedding failed with status ${response.status}`);
                }

                return response;
            },
            {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 5000,
                backoffFactor: 2,
            }
        );

        logger.info(`Successfully embedded job ${jobId}`);
    } catch (error) {
        logger.error(`Failed to embed job ${jobId} after all retry attempts. This will not block the user.`, error);
    }
}

export const findSimilar = async (jobId: string, userId: string) => {
    const job = await getJobById(jobId, userId);
    if (!job.description) {
        throw new ValidationError('Source job has no description');
    }

    const response = await fetch(`${config.aiServiceUrl}/find-similar-jobs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({ job_id: jobId, job_description: job.description }),
    });
    if (!response.ok) throw new Error('Failed to fetch similar jobs from AI service.');

    const similarJobIds = (await response.json()).map((j: any) => j.id);

    if (similarJobIds.length === 0) return [];

    return db.query.jobApplications.findMany({
        where: and(inArray(jobApplications.id, similarJobIds), eq(jobApplications.userId, userId)),
        with: {
            platform: true,
        },
    });
};

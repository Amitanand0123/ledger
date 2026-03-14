import { db } from '../db/client.js';
import {
    jobApplications,
    statusHistory,
    documents,
    interviews,
    notes,
} from '../db/schema/index.js';
import { eq, and, or, gte, lte, ilike, asc, desc, inArray, SQL, sql } from 'drizzle-orm';
import app from '../app.js';
import { parseSalary } from '../utils/salaryParser.js';
import { createPlatform } from './platform.service.js';
import { getFileBufferFromS3 } from './s3.service.js';
import { extractTextFromPdf } from '../utils/pdf.utils.js';
import config from '../config/index.js';
import { logger } from '@/utils/logger.js';
import { NotFoundError, ForbiddenError, ValidationError } from '@/utils/ApiError.js';

const AI_FETCH_TIMEOUT_MS = 90_000; // 90 seconds

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
    const { salary, platformName, deadline, offerDeadline, offerStartDate, ...restOfData } = data;
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
                offerDeadline: offerDeadline ? new Date(offerDeadline) : null,
                offerStartDate: offerStartDate ? new Date(offerStartDate) : null,
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
        embedJobDescription(newJob.id, newJob.description, newJob.userId).catch(err =>
            logger.error('embedJobDescription failed:', err)
        );

        // Auto-score with AI if description exists
        scoreJob(newJob.id, userId).then(result => {
            if (result) {
                logger.info(`Auto-scored job ${newJob.id}: ${result.aiScore}/100`);
                onJobDataChange(userId); // Notify frontend of score update
            }
        }).catch(err =>
            logger.error('Auto-score failed:', err)
        );
    }

    onJobDataChange(userId);
    return newJob;
};

export const updateJob = async (jobId: string, userId: string, data: any) => {
    const jobToUpdate = await getJobById(jobId, userId);

    if (data.description && data.summary) {
        throw new ValidationError('Cannot update both description and summary in the same request. Please send them separately.');
    }

    const { platformName, resumeId, coverLetterId, deadline, offerDeadline, offerStartDate, ...restOfData } = data;
    const updateData: any = { ...restOfData };

    if (deadline !== undefined) {
        updateData.deadline = deadline ? new Date(deadline) : null;
    }

    if (offerDeadline !== undefined) {
        updateData.offerDeadline = offerDeadline ? new Date(offerDeadline) : null;
    }

    if (offerStartDate !== undefined) {
        updateData.offerStartDate = offerStartDate ? new Date(offerStartDate) : null;
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
        embedJobDescription(updatedJob.id, updatedJob.description!, updatedJob.userId).catch(err =>
            logger.error('embedJobDescription failed:', err)
        );
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

    const resumeBuffer = await getFileBufferFromS3(resumeDoc.fileKey);
    if (!resumeBuffer) throw new ValidationError('Could not read resume file from storage');
    const resumeText = await extractTextFromPdf(resumeBuffer);
    if (!resumeText) throw new ValidationError('Could not extract text from resume PDF');

    const resumeAnalysisRes = await fetch(`${config.aiServiceUrl}/analyze-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({ resume_text: resumeText }),
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!resumeAnalysisRes.ok) {
        const errorText = await resumeAnalysisRes.text();
        let errorDetail: string;
        try {
            const parsed = JSON.parse(errorText);
            errorDetail = parsed.detail || errorText;
        } catch {
            errorDetail = errorText;
        }
        throw new Error(`AI service failed to analyze resume: ${errorDetail}`);
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
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!matchAnalysisRes.ok) {
        const errorText = await matchAnalysisRes.text();
        let errorDetail: string;
        try {
            const parsed = JSON.parse(errorText);
            errorDetail = parsed.detail || errorText;
        } catch {
            errorDetail = errorText;
        }
        throw new Error(`AI service failed to match job: ${errorDetail}`);
    }
    const matchAnalysis = await matchAnalysisRes.json();

    return matchAnalysis;
};

export const scoreResumeStandalone = async (userId: string, resumeId: string, jobDescription: string) => {
    const [resumeDoc] = await db
        .select()
        .from(documents)
        .where(
            and(eq(documents.id, resumeId), eq(documents.userId, userId), eq(documents.type, 'RESUME'))
        )
        .limit(1);

    if (!resumeDoc) throw new NotFoundError('Resume');

    const resumeBuffer = await getFileBufferFromS3(resumeDoc.fileKey);
    if (!resumeBuffer) throw new ValidationError('Could not read resume file from storage');
    const resumeText = await extractTextFromPdf(resumeBuffer);
    if (!resumeText) throw new ValidationError('Could not extract text from resume PDF');

    const resumeAnalysisRes = await fetch(`${config.aiServiceUrl}/analyze-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({ resume_text: resumeText }),
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!resumeAnalysisRes.ok) {
        const errorText = await resumeAnalysisRes.text();
        let errorDetail: string;
        try {
            const parsed = JSON.parse(errorText);
            errorDetail = parsed.detail || errorText;
        } catch {
            errorDetail = errorText;
        }
        throw new Error(`AI service failed to analyze resume: ${errorDetail}`);
    }
    const resumeAnalysis = await resumeAnalysisRes.json();

    const matchAnalysisRes2 = await fetch(`${config.aiServiceUrl}/match-resume-to-job`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({
            resume_analysis: resumeAnalysis,
            job_description_text: jobDescription,
        }),
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!matchAnalysisRes2.ok) {
        const errorText = await matchAnalysisRes2.text();
        let errorDetail: string;
        try {
            const parsed = JSON.parse(errorText);
            errorDetail = parsed.detail || errorText;
        } catch {
            errorDetail = errorText;
        }
        throw new Error(`AI service failed to match job: ${errorDetail}`);
    }

    return matchAnalysisRes2.json();
};

export const getStatusCounts = async (userId: string) => {
    const result = await db
        .select({
            status: jobApplications.status,
            count: sql<number>`count(*)`,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .groupBy(jobApplications.status);

    const counts: Record<string, number> = {};
    let total = 0;
    result.forEach(row => {
        counts[row.status] = Number(row.count);
        total += Number(row.count);
    });
    counts['ALL'] = total;

    return counts;
};

export const bulkUpdateStatus = async (userId: string, ids: string[], status: string) => {
    const jobs = await db
        .select({ id: jobApplications.id })
        .from(jobApplications)
        .where(and(inArray(jobApplications.id, ids), eq(jobApplications.userId, userId)));

    const ownedIds = jobs.map(j => j.id);
    if (ownedIds.length === 0) return { count: 0 };

    await db
        .update(jobApplications)
        .set({ status: status as any })
        .where(inArray(jobApplications.id, ownedIds));

    await db.insert(statusHistory).values(
        ownedIds.map(id => ({ jobId: id, status: status as any }))
    );

    onJobDataChange(userId);
    return { count: ownedIds.length };
};

export const scoreJob = async (jobId: string, userId: string) => {
    const job = await db.query.jobApplications.findFirst({
        where: and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)),
        with: { resume: true },
    });

    if (!job || !job.description) return null;

    let resumeDoc = job.resume;
    if (!resumeDoc) {
        const [firstResume] = await db
            .select()
            .from(documents)
            .where(and(eq(documents.userId, userId), eq(documents.type, 'RESUME')))
            .limit(1);
        resumeDoc = firstResume || null;
    }

    if (!resumeDoc) return null;

    const { getFileBufferFromS3 } = await import('./s3.service.js');
    const { extractTextFromPdf } = await import('../utils/pdf.utils.js');

    const resumeBuffer = await getFileBufferFromS3(resumeDoc.fileKey);
    if (!resumeBuffer) return null;
    const resumeText = await extractTextFromPdf(resumeBuffer);
    if (!resumeText) return null;

    const resumeAnalysisRes = await fetch(`${config.aiServiceUrl}/analyze-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({ resume_text: resumeText }),
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!resumeAnalysisRes.ok) return null;
    const resumeAnalysis = await resumeAnalysisRes.json();

    const matchRes = await fetch(`${config.aiServiceUrl}/match-resume-to-job`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.aiServiceApiKey}`,
        },
        body: JSON.stringify({
            resume_analysis: resumeAnalysis,
            job_description_text: job.description,
        }),
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!matchRes.ok) return null;
    const matchResult = await matchRes.json();

    const aiScore = Math.round(matchResult.match_score || 0);
    const rawSuggestions = matchResult.suggestions || '';
    const aiFitAssessment = Array.isArray(rawSuggestions) ? rawSuggestions.join('\n') : String(rawSuggestions);
    const aiTailoredSummary = matchResult.tailored_summary || `Match score: ${aiScore}/100. ${(matchResult.matching_skills || []).join(', ')}`;

    await db
        .update(jobApplications)
        .set({ aiScore, aiFitAssessment, aiTailoredSummary })
        .where(eq(jobApplications.id, jobId));

    return { aiScore, aiFitAssessment, aiTailoredSummary };
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


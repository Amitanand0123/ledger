import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as AIService from '../services/ai.service.js';
import * as JobService from '../services/job.service.js';
import * as AgentService from '../services/agent.service.js';
import { db } from '../db/client.js';
import { jobApplications } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { ValidationError, NotFoundError, ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getJobAnalysis = asyncHandler(async (req: any, res: Response) => {
    const { jobId } = req.params;
    if (!jobId) {
        throw new ValidationError('Job ID is required in the URL parameters.');
    }

    // Atomically increment the count only if below the limit to prevent race conditions
    const [updated] = await db
        .update(jobApplications)
        .set({ aiAnalysisCount: sql`${jobApplications.aiAnalysisCount} + 1` })
        .where(
            and(
                eq(jobApplications.id, jobId),
                eq(jobApplications.userId, req.user.id),
                sql`${jobApplications.aiAnalysisCount} < 2`
            )
        )
        .returning({
            description: jobApplications.description,
            aiAnalysisCount: jobApplications.aiAnalysisCount,
        });

    if (!updated) {
        // Check if the job exists vs. the limit was reached
        const [job] = await db
            .select({ id: jobApplications.id, aiAnalysisCount: jobApplications.aiAnalysisCount })
            .from(jobApplications)
            .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, req.user.id)))
            .limit(1);

        if (!job) {
            throw new NotFoundError('Job');
        }
        throw new ApiError(429, 'AI analysis limit reached for this job application.');
    }

    const analysis = await AIService.analyzeJobDescription(updated.description);

    if (!analysis) {
        throw new NotFoundError('Analysis');
    }

    sendSuccess(res, 200, { analysis });
});

export const extractJobFromUrl = asyncHandler(async (req: any, res: Response) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
        throw new ValidationError('A valid URL is required.');
    }

    try {
        new URL(url);
    } catch {
        throw new ValidationError('The provided URL is not valid.');
    }

    const extracted = await AIService.extractJobFromUrl(url);
    sendSuccess(res, 200, extracted);
});

export const scoreResume = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobDescription } = req.body;
    if (!resumeId || !jobDescription) {
        throw new ValidationError('resumeId and jobDescription are required.');
    }

    const result = await JobService.scoreResumeStandalone(req.user.id, resumeId, jobDescription);
    sendSuccess(res, 200, result);
});

export const rebuildResumeStandalone = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobDescription } = req.body;
    if (!resumeId || !jobDescription) {
        throw new ValidationError('resumeId and jobDescription are required.');
    }

    const result = await AgentService.rebuildResumeStandalone(req.user.id, resumeId, jobDescription);
    sendSuccess(res, 200, result);
});

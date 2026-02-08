import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as AIService from '../services/ai.service.js';
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

    const [job] = await db
        .select({
            aiAnalysisCount: jobApplications.aiAnalysisCount,
            description: jobApplications.description,
        })
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, req.user.id)))
        .limit(1);

    if (!job) {
        throw new NotFoundError('Job');
    }

    if (job.aiAnalysisCount >= 2) {
        throw new ApiError(429, 'AI analysis limit reached for this job application.');
    }

    const analysis = await AIService.analyzeJobDescription(job.description);

    if (!analysis) {
        throw new NotFoundError('Analysis');
    }

    await db
        .update(jobApplications)
        .set({ aiAnalysisCount: sql`${jobApplications.aiAnalysisCount} + 1` })
        .where(eq(jobApplications.id, jobId));

    sendSuccess(res, 200, { analysis });
});

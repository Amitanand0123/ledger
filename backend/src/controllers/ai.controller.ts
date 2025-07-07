import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as AIService from '../services/ai.service';
import { prisma } from '../config/db';

/**
 * @desc    Get AI-powered analysis for a specific job description
 * @route   GET /api/v1/ai/analyze/:jobId
 * @access  Private
 */
export const getJobAnalysis = asyncHandler(async (req: any, res: Response) => {
    const { jobId } = req.params;
    if (!jobId) {
        res.status(400);
        throw new Error('Job ID is required in the URL parameters.');
    }

    const job = await prisma.jobApplication.findFirst({
        where: { id: jobId, userId: req.user.id },
        select: { aiAnalysisCount: true, description: true },
    });

    if (!job) {
        res.status(404);
        throw new Error('Job not found or user not authorized.');
    }

    if (job.aiAnalysisCount >= 2) {
        res.status(429); // Too Many Requests
        throw new Error('AI analysis limit reached for this job application.');
    }

    const analysis = await AIService.analyzeJobDescription(job.description);

    if (!analysis) {
        res.status(404);
        throw new Error('Could not generate analysis. The description may be too short.');
    }
    
    // Increment the counter after a successful analysis
    await prisma.jobApplication.update({
        where: { id: jobId },
        data: { aiAnalysisCount: { increment: 1 } },
    });

    res.status(200).json({ analysis });
});
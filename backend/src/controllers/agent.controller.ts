import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as AgentService from '../services/agent.service.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const invokeAiAgent = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobId, userGoal } = req.body;

    if (!resumeId || !jobId || !userGoal) {
        throw new ValidationError("resumeId, jobId, and userGoal are required.");
    }

    const result = await AgentService.invokeAgent(req.user.id, resumeId, jobId, userGoal);
    sendSuccess(res, 200, result);
});

export const rebuildResume = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
        throw new ValidationError("resumeId and jobId are required.");
    }
    const result = await AgentService.rebuildResumeAndGeneratePdf(req.user.id, resumeId, jobId);
    sendSuccess(res, 200, result);
});
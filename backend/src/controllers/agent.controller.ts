import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as AgentService from '../services/agent.service.js';

/**
 * @desc    Invoke the AI Career Coach agent
 * @route   POST /api/v1/agent/invoke
 * @access  Private
 */
export const invokeAiAgent = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobId, userGoal } = req.body;
    
    if (!resumeId || !jobId || !userGoal) {
        res.status(400);
        throw new Error("resumeId, jobId, and userGoal are required.");
    }

    const result = await AgentService.invokeAgent(req.user.id, resumeId, jobId, userGoal);
    res.status(200).json(result);
});

/**
 * @desc    Rebuild a LaTeX resume with AI and get a PDF back
 * @route   POST /api/v1/agent/rebuild-resume
 * @access  Private
 */
export const rebuildResume = asyncHandler(async (req: any, res: Response) => {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
        res.status(400)
        throw(new Error("resumeId and jobId are required."));
    }
    const result = await AgentService.rebuildResumeAndGeneratePdf(req.user.id, resumeId, jobId);
    res.status(200).json(result);
});
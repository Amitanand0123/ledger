import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as InterviewService from '../services/interview.service.js';
import { interviewTypeEnum } from '../db/schema/index.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const VALID_INTERVIEW_TYPES = interviewTypeEnum.enumValues;

export const createInterview = asyncHandler(async (req: any, res: Response) => {
    const { jobId, type, scheduledAt, duration, location, notes } = req.body;

    if (!jobId || !type || !scheduledAt) {
        throw new ValidationError('Job ID, type, and scheduled time are required.');
    }

    if (!VALID_INTERVIEW_TYPES.includes(type)) {
        throw new ValidationError('Invalid interview type.');
    }

    const interview = await InterviewService.createInterview(jobId, req.user.id, {
        type,
        scheduledAt: new Date(scheduledAt),
        duration,
        location,
        notes,
    });

    sendSuccess(res, 201, interview);
});

export const getInterviewsForJob = asyncHandler(async (req: any, res: Response) => {
    const { jobId } = req.params;

    if (!jobId) {
        throw new ValidationError('Job ID is required.');
    }

    const interviews = await InterviewService.getInterviewsForJob(jobId, req.user.id);
    sendSuccess(res, 200, interviews);
});

export const getUpcomingInterviews = asyncHandler(async (req: any, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const interviews = await InterviewService.getUpcomingInterviews(req.user.id, limit);
    sendSuccess(res, 200, interviews);
});

export const getAllInterviews = asyncHandler(async (req: any, res: Response) => {
    const interviews = await InterviewService.getAllInterviews(req.user.id);
    sendSuccess(res, 200, interviews);
});

export const updateInterview = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { type, scheduledAt, duration, location, notes, completed } = req.body;

    if (!id) {
        throw new ValidationError('Interview ID is required.');
    }

    const updateData: any = {};
    if (type !== undefined) {
        if (!VALID_INTERVIEW_TYPES.includes(type)) {
            throw new ValidationError('Invalid interview type.');
        }
        updateData.type = type;
    }
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (duration !== undefined) updateData.duration = duration;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;

    const interview = await InterviewService.updateInterview(id, req.user.id, updateData);
    sendSuccess(res, 200, interview);
});

export const deleteInterview = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Interview ID is required.');
    }

    await InterviewService.deleteInterview(id, req.user.id);
    sendSuccess(res, 200, { id }, { message: 'Interview deleted successfully.' });
});

import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as JobService from '../services/job.service.js';
import { NotFoundError, ValidationError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types/express.js';
import { sendSuccess } from '../utils/response.js';

export const getJobApplications = asyncHandler(
    async (req: any, res: Response) => {
        const { ...filters } = req.query;
        const result = await JobService.getAllJobs(req.user.id, filters);
        sendSuccess(res, 200, result.data, { pagination: result.pagination });
    }
);

export const createJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const { ...jobData } = req.body;
        const job = await JobService.createJob(req.user.id, jobData);
        sendSuccess(res, 201, job);
    }
);

export const getJobApplicationById = asyncHandler(
    async (req: any, res: Response) => {
        const job = await JobService.getJobById(req.params.id, req.user.id);
        if (!job) {
            throw new NotFoundError('Job application');
        }
        sendSuccess(res, 200, job);
    }
);

export const updateJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const updatedJob = await JobService.updateJob(
            req.params.id,
            req.user.id,
            req.body
        );
        sendSuccess(res, 200, updatedJob);
    }
);

export const deleteJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const deletedJob = await JobService.deleteJob(
            req.params.id,
            req.user.id
        );
        sendSuccess(res, 200, { id: deletedJob.id }, { message: 'Job application deleted successfully.' });
    }
);

export const deleteBulkJobs = asyncHandler(
    async (req: any, res: Response) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new ValidationError('An array of job IDs is required.');
        }

        await JobService.deleteBulk(ids, req.user.id);

        sendSuccess(res, 200, null, { message: `${ids.length} jobs deleted successfully.` });
    }
);

export const analyzeJobMatch = asyncHandler(async (req: any, res: Response) => {
    const { id: jobId } = req.params;
    const { resumeId } = req.body;
    if (!resumeId) {
        throw new ValidationError('resumeId is required in the request body.');
    }
    const analysis = await JobService.analyzeMatch(req.user.id, jobId, resumeId);
    sendSuccess(res, 200, analysis);
});

export const findSimilarJobs = asyncHandler(async (req: any, res: Response) => {
    const similarJobs = await JobService.findSimilar(req.params.id, req.user.id);
    sendSuccess(res, 200, similarJobs);
});

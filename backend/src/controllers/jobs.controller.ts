import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as JobService from '../services/job.service.js';

/**
 * @desc    Get all job applications for the logged-in user or a team, with filtering
 * @route   GET /api/v1/jobs
 * @access  Private
 */
export const getJobApplications = asyncHandler(
    async (req: any, res: Response) => {
        const { teamId, ...filters } = req.query;
        const jobs = await JobService.getAllJobs(req.user.id, teamId, filters);
        res.status(200).json(jobs);
    }
);

/**
 * @desc    Create a new job application
 * @route   POST /api/v1/jobs
 * @access  Private
 */
export const createJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const { teamId, ...jobData } = req.body;
        const job = await JobService.createJob(req.user.id, teamId, jobData);
        res.status(201).json(job);
    }
);

/**
 * @desc    Get a single job application by its ID
 * @route   GET /api/v1/jobs/:id
 * @access  Private
 */
export const getJobApplicationById = asyncHandler(
    async (req: any, res: Response) => {
        const job = await JobService.getJobById(req.params.id, req.user.id);
        if (!job) {
            res.status(404);
            throw new Error('Job application not found.');
        }
        res.status(200).json(job);
    }
);

/**
 * @desc    Update an existing job application
 * @route   PUT /api/v1/jobs/:id
 * @access  Private
 */
export const updateJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const updatedJob = await JobService.updateJob(
            req.params.id,
            req.user.id,
            req.body
        );
        res.status(200).json(updatedJob);
    }
);

/**
 * @desc    Delete a job application
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private
 */
export const deleteJobApplication = asyncHandler(
    async (req: any, res: Response) => {
        const deletedJob = await JobService.deleteJob(
            req.params.id,
            req.user.id
        );
        res.status(200).json({
            id: deletedJob.id,
            message: 'Job application deleted successfully.',
        });
    }
);

/**
 * @desc    Delete multiple job applications
 * @route   DELETE /api/v1/jobs
 * @access  Private
 */
export const deleteBulkJobs = asyncHandler(
    async (req: any, res: Response) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400);
            throw new Error('An array of job IDs is required.');
        }
        
        await JobService.deleteBulk(ids, req.user.id);

        res.status(200).json({
            message: `${ids.length} jobs deleted successfully.`
        });
    }
)
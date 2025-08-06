import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';
import * as TeamService from './team.service.js';
import app from '../app.js';
import { parseSalary } from '../utils/salaryParser.js';
import { sendEmail } from './email.service.js';
import { createPlatform } from './platform.service.js';
import { getTextFromS3 } from './s3.service.js';
import config from '../config/index.js';
import expressAsyncHandler from 'express-async-handler';
import { logger } from '@/utils/logger.js';

const onJobDataChange = (userId: string, teamId?: string | null) => {
    const io = app.get('io');
    if (io) {
        const eventName = 'jobs_updated';
        if (teamId) io.to(`team_${teamId}`).emit(eventName, { teamId });
        else io.to(userId).emit(eventName, { userId });
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
};

// Common include object to ensure we always get related data
const jobInclude = {
    platform: true,
    resume: true,
    coverLetter: true,
};

export const getAllJobs = async (userId: string, teamId: string | undefined, filters: JobFilters = {}) => {
    if (teamId) {
        const permission = await TeamService.checkUserTeamPermission(userId, teamId);
        if (!permission) throw new Error("Access denied: You are not a member of this team.");
    }

    const where: Prisma.JobApplicationWhereInput = {
        teamId: teamId ?? null,
        ...(!teamId && { userId: userId }),
    };

    if (filters.search) {
        where.OR = [
            { company: { contains: filters.search, mode: 'insensitive' } },
            { position: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.salaryMin) where.salaryMin = { gte: parseInt(filters.salaryMin, 10) };
    if (filters.salaryMax) where.salaryMax = { lte: parseInt(filters.salaryMax, 10) };

    if (filters.startDate) {
        where.applicationDate = {
            ...where.applicationDate as Prisma.DateTimeFilter,
            gte: new Date(filters.startDate),
        };
    }
    if (filters.endDate) {
        where.applicationDate = {
            ...where.applicationDate as Prisma.DateTimeFilter,
            lte: new Date(filters.endDate),
        };
    }
    
    return prisma.jobApplication.findMany({
        where,
        orderBy: { order: 'asc' },
        include: jobInclude, // FIXED: Include related documents
    });
};

export const getJobById = async (jobId: string, userId: string) => {
    const job = await prisma.jobApplication.findUnique({
        where: { id: jobId },
        include: { ...jobInclude, statusHistory: { orderBy: { changedAt: 'asc' } } } // FIXED: Include related documents
    });
    if (!job) return null;
    if (job.teamId) {
        const permission = await TeamService.checkUserTeamPermission(userId, job.teamId);
        if (!permission) throw new Error("Permission denied: You cannot view this team's job.");
    } else {
        if (job.userId !== userId) throw new Error("Permission denied: You do not own this job application.");
    }
    return job;
};

export const createJob = async (userId: string, teamId: string | undefined, data: any) => {
    if (teamId) {
        const permission = await TeamService.checkUserTeamPermission(userId, teamId);
        if (!permission || !['OWNER', 'EDITOR'].includes(permission)) throw new Error("Permission denied: You cannot add jobs to this team.");
    }
    
    const { salary, platformName, ...restOfData } = data;
    const { min, max } = parseSalary(salary);
    
    let platformId = null;
    if (platformName) {
        const platform = await createPlatform(platformName);
        platformId = platform.id;
    }

    const newJob = await prisma.jobApplication.create({
        data: {
            ...restOfData,
            salary,
            salaryMin: min,
            salaryMax: max,
            userId,
            teamId: teamId ?? null,
            platformId,
            statusHistory: { create: [{ status: data.status || 'PENDING' }] }
        },
        include: jobInclude,
    });
    if (newJob.description) {
        embedJobDescription(newJob.id, newJob.description, newJob.userId);
    }

    onJobDataChange(userId, teamId);
    return newJob;
};

export const updateJob = async (jobId: string, userId: string, data: any) => {
    const jobToUpdate = await getJobById(jobId, userId);
    if (!jobToUpdate) throw new Error("Job not found or permission denied.");

    // IMPORTANT: Prevent the original description from being overwritten by a summary
    if (data.description && data.summary) {
        // If both are somehow sent, prioritize the new summary logic
        // and ignore changes to the original description.
        delete data.description;
    }

    const { platformName, ...restOfData } = data;
    const updateData: Prisma.JobApplicationUpdateInput = { ...restOfData };
    
    if (platformName) {
        const platform = await createPlatform(platformName);
        updateData.platform = { connect: { id: platform.id } };
    } else if (platformName === '' || platformName === null) { 
        updateData.platform = { disconnect: true };
    }

    if (data.salary) {
        const { min, max } = parseSalary(data.salary);
        updateData.salaryMin = min;
        updateData.salaryMax = max;
    }

    // Trigger webhook and email on status change
    if (data.status && data.status !== jobToUpdate.status) {
        updateData.statusHistory = { create: [{ status: data.status }] };
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Trigger webhook
        await triggerWebhook(userId, "job.status.changed", {
            job: {
                id: jobId,
                company: jobToUpdate.company,
                position: jobToUpdate.position,
                oldStatus: jobToUpdate.status,
                newStatus: data.status,
                url: jobToUpdate.url
            },
            user: { id: userId, name: user?.name }
        });
        
        // Send email for important status changes
        if (user && (data.status.toUpperCase().includes('INTERVIEW') || data.status.toUpperCase().includes('HIRED'))) {
            const subject = data.status.toUpperCase().includes('HIRED') ? `Congratulations on your new role!` : `You have an interview!`;
            const textBody = `Your application for ${jobToUpdate.position} at ${jobToUpdate.company} is now: ${data.status}.`;
            sendEmail({ to: user.email, subject, text: textBody, html: `<p>${textBody}</p>` });
        }
    }
    
    const updatedJob = await prisma.jobApplication.update({ 
        where: { id: jobId }, 
        data: updateData,
        include: { platform: true, resume: true, coverLetter: true },
    });

    if (data.description && data.description !== jobToUpdate.description) {
        embedJobDescription(updatedJob.id, updatedJob.description!, updatedJob.userId);
    }

    onJobDataChange(userId, updatedJob.teamId);
    return updatedJob;
};


export const deleteJob = async (jobId: string, userId: string) => {
    const jobToDelete = await getJobById(jobId, userId);
    if (!jobToDelete) throw new Error("Job not found or permission denied.");
    const deletedJob = await prisma.jobApplication.delete({ where: { id: jobId } });
    onJobDataChange(userId, deletedJob.teamId);
    return deletedJob;
};

export const deleteBulk = async (ids: string[], userId: string) => {
    const result = await prisma.jobApplication.deleteMany({
        where: {
            id: { in: ids },
            userId: userId,
        }
    });

    onJobDataChange(userId);
    return result;
}

export const analyzeMatch = async (userId: string, jobId: string, resumeId: string) => {
    // 1. Verify user owns the job and the resume document
    const job = await getJobById(jobId, userId);
    if (!job || !job.description) throw new Error('Job not found, has no description, or permission denied.');

    const resumeDoc = await prisma.document.findFirst({
        where: { id: resumeId, userId: userId, type: 'RESUME' }
    });
    if (!resumeDoc) throw new Error('Resume not found or permission denied.');

    // 2. Get resume text from S3
    const resumeText = await getTextFromS3(resumeDoc.fileKey);
    if (!resumeText) throw new Error('Could not read resume file content.');

    // 3. Call AI service to analyze the resume
    const resumeAnalysisRes = await fetch(`${config.aiServiceUrl}/analyze-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.aiServiceApiKey}`
        },
        body: JSON.stringify({ resume_text: resumeText })
    });
    if (!resumeAnalysisRes.ok) {
        const error = await resumeAnalysisRes.json();
        throw new Error(`AI service failed to analyze resume: ${error.detail}`);
    }
    const resumeAnalysis = await resumeAnalysisRes.json();

    // 4. Call AI service to get the final match analysis
    const matchAnalysisRes = await fetch(`${config.aiServiceUrl}/match-resume-to-job`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.aiServiceApiKey}`
        },
        body: JSON.stringify({
            resume_analysis: resumeAnalysis,
            job_description_text: job.description
        })
    });
    if (!matchAnalysisRes.ok) {
         const error = await matchAnalysisRes.json();
        throw new Error(`AI service failed to match job: ${error.detail}`);
    }
    const matchAnalysis = await matchAnalysisRes.json();

    return matchAnalysis;
};

async function triggerWebhook(userId: string, eventType: string, payload: any) {
    const webhook = await prisma.webhook.findUnique({
        where: { userId_eventType: { userId, eventType } }
    });
    
    if (webhook) {
        try {
            // Instead of fetching, we create a record in our new table.
            await prisma.webhookJob.create({
                data: {
                    webhookId: webhook.id,
                    payload: payload,
                    status: 'PENDING',
                }
            });
            logger.info(`Queued webhook job for user ${userId}, event: ${eventType}`);
        } catch (error) {
            logger.error(`Failed to queue webhook for user ${userId}:`, error);
        }
    }
}

async function embedJobDescription(jobId: string, description: string, userId: string) {
    try {
        logger.info(`Embedding job description for job ${jobId}, user ${userId}`);
        await fetch(`${config.aiServiceUrl}/embed-job`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.aiServiceApiKey}`
            },
            // --- MODIFIED: Pass user_id in the body ---
            body: JSON.stringify({ 
                job_id: jobId, 
                job_description: description,
                user_id: userId 
            })
        });
    } catch (error) {
        logger.error(`Failed to embed job ${jobId}. This will not block the user.`, error);
    }
}

export const findSimilar = async (jobId: string, userId: string) => {
    const job = await getJobById(jobId, userId);
    if (!job || !job.description) {
        throw new Error("Source job not found or has no description.");
    }
    
    // Call AI Service
    const response = await fetch(`${config.aiServiceUrl}/find-similar-jobs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.aiServiceApiKey}`
        },
        body: JSON.stringify({ job_id: jobId, job_description: job.description })
    });
    if (!response.ok) throw new Error("Failed to fetch similar jobs from AI service.");

    const similarJobIds = (await response.json()).map((j: any) => j.id);

    if (similarJobIds.length === 0) return [];
    
    // Fetch full job details from our DB for the returned IDs
    return prisma.jobApplication.findMany({
        where: {
            id: { in: similarJobIds },
            userId: userId, // Ensure user owns the results
        },
        include: { platform: true }
    });
};


import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';
import * as TeamService from './team.service';
import app from '../app';
import { parseSalary } from '../utils/salaryParser';
import { sendEmail } from './email.service';
import { createPlatform } from './platform.service';

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

    onJobDataChange(userId, teamId);
    return newJob;
};

export const updateJob = async (jobId: string, userId: string, data: any) => {
    const jobToUpdate = await getJobById(jobId, userId);
    if (!jobToUpdate) throw new Error("Job not found or permission denied.");

    const { platformName, ...restOfData } = data;
    const updateData: Prisma.JobApplicationUpdateInput = { ...restOfData };
    
    if (platformName) {
        const platform = await createPlatform(platformName);
        updateData.platform = { connect: { id: platform.id } };
    } else if (platformName === '') { // Handle clearing the platform
        updateData.platform = { disconnect: true };
    }

    if (data.salary) {
        const { min, max } = parseSalary(data.salary);
        updateData.salaryMin = min;
        updateData.salaryMax = max;
    }

    if (data.status && data.status !== jobToUpdate.status) {
        updateData.statusHistory = { create: [{ status: data.status }] };
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && (data.status.toUpperCase().includes('INTERVIEW') || data.status.toUpperCase().includes('HIRED'))) {
            const subject = data.status.toUpperCase().includes('HIRED') ? `Congratulations on your new role!` : `You have an interview!`;
            const textBody = `Your application for ${jobToUpdate.position} at ${jobToUpdate.company} is now: ${data.status}.`;
            sendEmail({ to: user.email, subject, text: textBody, html: `<p>${textBody}</p>` });
        }
    }
    const updatedJob = await prisma.jobApplication.update({ 
        where: { id: jobId }, 
        data: updateData,
        include: jobInclude,
    });
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
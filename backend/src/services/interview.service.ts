import { db } from '../db/client.js';
import { interviews, jobApplications, interviewTypeEnum } from '../db/schema/index.js';
import { eq, and, gte, asc, desc, inArray } from 'drizzle-orm';

// Type inference from enum
type InterviewType = typeof interviewTypeEnum.enumValues[number];

export const createInterview = async (
    jobId: string,
    userId: string,
    data: {
        type: InterviewType;
        scheduledAt: Date;
        duration?: number;
        location?: string;
        notes?: string;
    }
) => {
    // Verify job belongs to user
    const [job] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!job) {
        throw new Error('Job application not found or you do not have permission.');
    }

    const [interview] = await db
        .insert(interviews)
        .values({
            jobId,
            ...data,
        })
        .returning();

    return interview;
};

export const getInterviewsForJob = async (jobId: string, userId: string) => {
    // Verify job belongs to user
    const [job] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!job) {
        throw new Error('Job application not found or you do not have permission.');
    }

    return db
        .select()
        .from(interviews)
        .where(eq(interviews.jobId, jobId))
        .orderBy(asc(interviews.scheduledAt));
};

export const getUpcomingInterviews = async (userId: string, limit: number = 5) => {
    const now = new Date();

    // Get user's job IDs first, then filter interviews at DB level instead of in-memory
    const userJobIds = db
        .select({ id: jobApplications.id })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

    const results = await db.query.interviews.findMany({
        where: and(
            gte(interviews.scheduledAt, now),
            eq(interviews.completed, false),
            inArray(interviews.jobId, userJobIds)
        ),
        with: {
            job: {
                columns: {
                    id: true,
                    company: true,
                    position: true,
                    status: true,
                    userId: true,
                },
            },
        },
        orderBy: asc(interviews.scheduledAt),
        limit,
    });

    return results;
};

export const getAllInterviews = async (userId: string) => {
    // Get user's job IDs first, then filter interviews at DB level instead of in-memory
    const userJobIds = db
        .select({ id: jobApplications.id })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

    const results = await db.query.interviews.findMany({
        where: inArray(interviews.jobId, userJobIds),
        with: {
            job: {
                columns: {
                    id: true,
                    company: true,
                    position: true,
                    status: true,
                    userId: true,
                },
            },
        },
        orderBy: desc(interviews.scheduledAt),
    });

    return results;
};

export const updateInterview = async (
    interviewId: string,
    userId: string,
    data: {
        type?: InterviewType;
        scheduledAt?: Date;
        duration?: number;
        location?: string;
        notes?: string;
        completed?: boolean;
    }
) => {
    // Verify interview belongs to user (need to join with job table)
    const [interview] = await db
        .select({
            id: interviews.id,
        })
        .from(interviews)
        .innerJoin(jobApplications, eq(interviews.jobId, jobApplications.id))
        .where(and(eq(interviews.id, interviewId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!interview) {
        throw new Error('Interview not found or you do not have permission.');
    }

    const [updatedInterview] = await db
        .update(interviews)
        .set(data)
        .where(eq(interviews.id, interviewId))
        .returning();

    return updatedInterview;
};

export const deleteInterview = async (interviewId: string, userId: string) => {
    // Verify interview belongs to user (need to join with job table)
    const [interview] = await db
        .select({
            id: interviews.id,
        })
        .from(interviews)
        .innerJoin(jobApplications, eq(interviews.jobId, jobApplications.id))
        .where(and(eq(interviews.id, interviewId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!interview) {
        throw new Error('Interview not found or you do not have permission.');
    }

    const [deletedInterview] = await db
        .delete(interviews)
        .where(eq(interviews.id, interviewId))
        .returning();

    return deletedInterview;
};

import { db } from '../db/client.js';
import { users, jobApplications, statusHistory, jobPlatforms } from '../db/schema/index.js';
import { eq, and, gte, isNotNull, inArray, sql, count, desc } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export const updateUserProfile = async (userId: string, name: string) => {
    const [updatedUser] = await db
        .update(users)
        .set({ name })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            onboardingCompleted: users.onboardingCompleted,
        });

    return updatedUser;
};

export const completeOnboarding = async (userId: string) => {
    const [updatedUser] = await db
        .update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            onboardingCompleted: users.onboardingCompleted,
        });

    return updatedUser;
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
        throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect current password.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    const [updatedUser] = await db
        .update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, userId))
        .returning();

    return updatedUser;
};

export const getApplicationStats = async (userId: string) => {
    // Get total count
    const totalApplicationsResult = await db
        .select({ count: count() })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

    const totalApplications = Number(totalApplicationsResult[0]?.count || 0);

    // Get status counts (groupBy)
    const statusCountsResult = await db
        .select({
            status: jobApplications.status,
            count: count(),
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .groupBy(jobApplications.status)
        .orderBy(desc(count()));

    const funnelData = statusCountsResult.map((item) => ({
        name: item.status.replace(/_/g, ' '),
        value: Number(item.count),
    }));

    // Get applications by month (raw SQL)
    const applicationsByMonth = await db.execute<{
        month: string;
        count: string;
    }>(sql`
        SELECT TO_CHAR("applicationDate", 'YYYY-MM') as month, COUNT(*) as count
        FROM "JobApplication"
        WHERE "userId" = ${userId}
        GROUP BY month
        ORDER BY month ASC
    `);

    // Drizzle returns rows directly in the result array, not in a .rows property
    const timeSeriesData = (applicationsByMonth || []).map((row) => ({
        name: row.month,
        count: Number(row.count),
    }));

    return {
        totalApplications,
        funnelData,
        timeSeriesData,
    };
};

export const getAdvancedApplicationStats = async (userId: string) => {
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));

    // Count applications this week
    const applicationsThisWeekResult = await db
        .select({ count: count() })
        .from(jobApplications)
        .where(and(eq(jobApplications.userId, userId), gte(jobApplications.applicationDate, sevenDaysAgo)));

    const applicationsThisWeek = Number(applicationsThisWeekResult[0]?.count || 0);

    // Count interviews this week (need to join with jobApplications)
    const interviewsThisWeekResult = await db
        .select({ count: count() })
        .from(statusHistory)
        .innerJoin(jobApplications, eq(statusHistory.jobId, jobApplications.id))
        .where(
            and(
                eq(jobApplications.userId, userId),
                eq(statusHistory.status, 'INTERVIEW'),
                gte(statusHistory.changedAt, sevenDaysAgo)
            )
        );

    const interviewsThisWeek = Number(interviewsThisWeekResult[0]?.count || 0);

    // Get all jobs with status history for calculations
    const allJobs = await db.query.jobApplications.findMany({
        where: eq(jobApplications.userId, userId),
        columns: {
            id: true,
            status: true,
            applicationDate: true,
        },
        with: {
            statusHistory: {
                columns: {
                    status: true,
                    changedAt: true,
                },
            },
        },
    });

    const totalApplications = allJobs.length;
    if (totalApplications === 0) {
        return {
            applicationsThisWeek: 0,
            interviewsThisWeek: 0,
            applicationToInterviewRate: 0,
            averageTimeToInterview: null,
            topPlatforms: [],
        };
    }

    const jobsWithInterview = allJobs.filter(
        (job) => job.status === 'INTERVIEW' || job.statusHistory.some((h) => h.status === 'INTERVIEW')
    );
    const applicationToInterviewRate =
        totalApplications > 0 ? (jobsWithInterview.length / totalApplications) * 100 : 0;

    let totalDaysToInterview = 0;
    let interviewsCounted = 0;
    jobsWithInterview.forEach((job) => {
        const firstInterview = job.statusHistory.find((h) => h.status === 'INTERVIEW');
        if (firstInterview) {
            const timeDiff =
                new Date(firstInterview.changedAt).getTime() - new Date(job.applicationDate).getTime();
            totalDaysToInterview += timeDiff / (1000 * 3600 * 24);
            interviewsCounted++;
        }
    });
    const averageTimeToInterview = interviewsCounted > 0 ? totalDaysToInterview / interviewsCounted : null;

    // Get top platforms (groupBy)
    const topPlatformsResult = await db
        .select({
            platformId: jobApplications.platformId,
            count: count(),
        })
        .from(jobApplications)
        .where(and(eq(jobApplications.userId, userId), isNotNull(jobApplications.platformId)))
        .groupBy(jobApplications.platformId)
        .orderBy(desc(count()))
        .limit(5);

    const platformIds = topPlatformsResult
        .map((p) => p.platformId)
        .filter((id) => id !== null) as string[];

    if (platformIds.length === 0) {
        return {
            applicationsThisWeek,
            interviewsThisWeek,
            applicationToInterviewRate: parseFloat(applicationToInterviewRate.toFixed(1)),
            averageTimeToInterview: averageTimeToInterview ? parseFloat(averageTimeToInterview.toFixed(1)) : null,
            topPlatforms: [],
        };
    }

    const platforms = await db
        .select()
        .from(jobPlatforms)
        .where(inArray(jobPlatforms.id, platformIds));

    const platformMap = new Map(platforms.map((p) => [p.id, p.name]));
    const topPlatformsWithName = topPlatformsResult.map((p) => ({
        name: platformMap.get(p.platformId!),
        count: Number(p.count),
    }));

    return {
        applicationsThisWeek,
        interviewsThisWeek,
        applicationToInterviewRate: parseFloat(applicationToInterviewRate.toFixed(1)),
        averageTimeToInterview: averageTimeToInterview ? parseFloat(averageTimeToInterview.toFixed(1)) : null,
        topPlatforms: topPlatformsWithName,
    };
};

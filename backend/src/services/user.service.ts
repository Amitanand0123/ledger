import { db } from '../db/client.js';
import { users, jobApplications, statusHistory, jobPlatforms } from '../db/schema/index.js';
import { eq, and, gte, lte, isNotNull, inArray, sql, count, desc } from 'drizzle-orm';
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

export const getOverviewStats = async (userId: string, days: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const startDateISO = startDate.toISOString();

    // 1. Applications per day
    const applicationsPerDay = await db.execute<{ date: string; count: string }>(sql`
        SELECT TO_CHAR("applicationDate", 'YYYY-MM-DD') as date, COUNT(*) as count
        FROM "JobApplication"
        WHERE "userId" = ${userId} AND "applicationDate" >= ${startDateISO}
        GROUP BY date
        ORDER BY date ASC
    `);

    const dailyData = (applicationsPerDay || []).map(row => ({
        date: row.date,
        count: Number(row.count),
    }));

    const totalInRange = dailyData.reduce((sum, d) => sum + d.count, 0);
    const avgPerDay = days > 0 ? parseFloat((totalInRange / days).toFixed(1)) : 0;

    // 2. Funnel data - count by key statuses
    const funnelResult = await db
        .select({ status: jobApplications.status, count: count() })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .groupBy(jobApplications.status)
        .orderBy(desc(count()));

    const funnelData = funnelResult.map(row => ({
        status: row.status,
        count: Number(row.count),
    }));

    // 3. Conversion rate
    const totalApplied = funnelData.reduce((sum, d) => sum + d.count, 0);
    const RESPONSE_STATUSES = ['INTERVIEW', 'OFFER', 'ACCEPTED'];
    const responded = funnelData
        .filter(d => RESPONSE_STATUSES.includes(d.status))
        .reduce((sum, d) => sum + d.count, 0);
    const conversionRate = totalApplied > 0 ? parseFloat(((responded / totalApplied) * 100).toFixed(1)) : 0;

    // 4. Conversion rate over time (rolling 7-day average)
    // Get all status history entries within range, grouped by day
    const statusChanges = await db.execute<{ date: string; status: string }>(sql`
        SELECT TO_CHAR(sh."changedAt", 'YYYY-MM-DD') as date, sh."status"
        FROM "StatusHistory" sh
        INNER JOIN "JobApplication" ja ON sh."jobId" = ja."id"
        WHERE ja."userId" = ${userId} AND sh."changedAt" >= ${startDateISO}
        ORDER BY date ASC
    `);

    // Build daily conversion: for each day, calculate cumulative responded/total
    const allApps = await db.execute<{ date: string; count: string }>(sql`
        SELECT TO_CHAR("applicationDate", 'YYYY-MM-DD') as date, COUNT(*) as count
        FROM "JobApplication"
        WHERE "userId" = ${userId} AND "applicationDate" >= ${startDateISO}
        GROUP BY date
        ORDER BY date ASC
    `);

    // Create a map of daily new applications and daily new responses
    const dayMap = new Map<string, { apps: number; responses: number }>();
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        dayMap.set(key, { apps: 0, responses: 0 });
    }

    (allApps || []).forEach(row => {
        const entry = dayMap.get(row.date);
        if (entry) entry.apps = Number(row.count);
    });

    (statusChanges || []).forEach(row => {
        if (RESPONSE_STATUSES.includes(row.status)) {
            const entry = dayMap.get(row.date);
            if (entry) entry.responses++;
        }
    });

    // Rolling 7-day average
    const sortedDays = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    const conversionOverTime: { date: string; rate: number }[] = [];

    for (let i = 0; i < sortedDays.length; i++) {
        const windowStart = Math.max(0, i - 6);
        let windowApps = 0;
        let windowResponses = 0;
        for (let j = windowStart; j <= i; j++) {
            windowApps += sortedDays[j][1].apps;
            windowResponses += sortedDays[j][1].responses;
        }
        const rate = windowApps > 0 ? parseFloat(((windowResponses / windowApps) * 100).toFixed(1)) : 0;
        conversionOverTime.push({ date: sortedDays[i][0], rate });
    }

    // 5. Response rate by source (platform)
    const responseBySourceResult = await db.execute<{
        platform_id: string;
        platform_name: string;
        total: string;
        responded: string;
    }>(sql`
        SELECT
            jp."id" as platform_id,
            jp."name" as platform_name,
            COUNT(*) as total,
            SUM(CASE WHEN ja."status" IN ('INTERVIEW', 'OFFER', 'ACCEPTED') THEN 1 ELSE 0 END) as responded
        FROM "JobApplication" ja
        INNER JOIN "JobPlatform" jp ON ja."platformId" = jp."id"
        WHERE ja."userId" = ${userId}
        GROUP BY jp."id", jp."name"
        ORDER BY total DESC
    `);

    const responseBySource = (responseBySourceResult || []).map(row => ({
        platform: row.platform_name,
        total: Number(row.total),
        responded: Number(row.responded),
        rate: Number(row.total) > 0
            ? parseFloat(((Number(row.responded) / Number(row.total)) * 100).toFixed(1))
            : 0,
    }));

    return {
        applicationsPerDay: dailyData,
        totalInRange,
        avgPerDay,
        funnelData,
        conversionRate,
        respondedCount: responded,
        totalCount: totalApplied,
        conversionOverTime,
        responseBySource,
    };
};

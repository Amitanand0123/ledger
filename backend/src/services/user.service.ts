import { prisma } from '../config/db.js';
import * as bcrypt from 'bcryptjs';
import Airtable, { FieldSet, Records } from 'airtable';

// Update a user's profile information (currently just name)
export const updateUserProfile = (userId: string, name: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { name },
        select: { id: true, name: true, email: true },
    });
};

// Change a user's password after verifying their current one
export const changePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect current password.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    return prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
};

// Calculate and return statistics for a user's job applications
export const getApplicationStats = async (userId: string) => {
    const totalApplications = await prisma.jobApplication.count({
        where: { userId, teamId: null },
    });

    const statusCounts = await prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId, teamId: null },
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
    });

    const funnelData = statusCounts.map((item: { status: string; _count: { status: number } }) => ({
        name: item.status.replace(/_/g, ' '),
        value: item._count.status,
    }));

    const applicationsByMonth = await prisma.$queryRaw<
        Array<{ month: string; count: bigint }>
    >`
        SELECT TO_CHAR("applicationDate", 'YYYY-MM') as month, COUNT(*) as count
        FROM "JobApplication"
        WHERE "userId" = ${userId} AND "teamId" IS NULL
        GROUP BY month
        ORDER BY month ASC;
    `;

    const timeSeriesData = applicationsByMonth.map((row) => ({
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

    // 1. Basic counts for the last week
    const applicationsThisWeek = await prisma.jobApplication.count({
        where: { userId, applicationDate: { gte: sevenDaysAgo } },
    });

    const interviewsThisWeek = await prisma.statusHistory.count({
        where: {
            job: { userId: userId,},
            status: { contains: 'INTERVIEW', mode: 'insensitive' },
            changedAt: { gte: sevenDaysAgo },
        },
    });

    // 2. Aggregations for rates and averages
    const allJobs = await prisma.jobApplication.findMany({
        where: { userId },
        select: { id: true, status: true, applicationDate: true, statusHistory: { select: { status: true, changedAt: true } } },
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

    const jobsWithInterview = allJobs.filter(job =>
        job.status.toUpperCase().includes('INTERVIEW') ||
        job.statusHistory.some(h => h.status.toUpperCase().includes('INTERVIEW'))
    );
    const applicationToInterviewRate = totalApplications > 0 ? (jobsWithInterview.length / totalApplications) * 100 : 0;

    let totalDaysToInterview = 0;
    let interviewsCounted = 0;
    jobsWithInterview.forEach(job => {
        const firstInterview = job.statusHistory.find(h => h.status.toUpperCase().includes('INTERVIEW'));
        if (firstInterview) {
            const timeDiff = new Date(firstInterview.changedAt).getTime() - new Date(job.applicationDate).getTime();
            totalDaysToInterview += timeDiff / (1000 * 3600 * 24);
            interviewsCounted++;
        }
    });
    const averageTimeToInterview = interviewsCounted > 0 ? totalDaysToInterview / interviewsCounted : null;

    // 3. Top platforms
    const topPlatforms = await prisma.jobApplication.groupBy({
        by: ['platformId'],
        where: { userId, platformId: { not: null } },
        _count: { platformId: true },
        orderBy: { _count: { platformId: 'desc' } },
        take: 5,
    });
    
    // Fetch platform names for the IDs
    const platformIds = topPlatforms.map(p => p.platformId).filter(id => id !== null) as string[];
    const platforms = await prisma.jobPlatform.findMany({
        where: { id: { in: platformIds } },
    });
    const platformMap = new Map(platforms.map(p => [p.id, p.name]));
    const topPlatformsWithName = topPlatforms.map(p => ({
        name: platformMap.get(p.platformId!),
        count: p._count.platformId
    }));

    return {
        applicationsThisWeek,
        interviewsThisWeek,
        applicationToInterviewRate: parseFloat(applicationToInterviewRate.toFixed(1)),
        averageTimeToInterview: averageTimeToInterview ? parseFloat(averageTimeToInterview.toFixed(1)) : null,
        topPlatforms: topPlatformsWithName,
    };
};

export const updateAirtableSettings = async (userId: string, settings: { apiKey?: string, baseId?: string, tableName?: string }) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            airtableApiKey: settings.apiKey,
            airtableBaseId: settings.baseId,
            airtableTableName: settings.tableName,
        }
    });
};

export const syncJobsToAirtable = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.airtableApiKey || !user.airtableBaseId || !user.airtableTableName) {
        throw new Error("Airtable settings are not completely configured. Please check your API Key, Base ID, and Table Name in settings.");
    }

    const jobs = await prisma.jobApplication.findMany({
        where: { userId, teamId: null }, // Only sync personal jobs
        include: { platform: true }
    });

    const base = new Airtable({ apiKey: user.airtableApiKey }).base(user.airtableBaseId);
    const table = base(user.airtableTableName);

    // Map our job data to Airtable-compatible field names
    const jobsToSync = jobs.map(job => ({
        jobtracker_id: job.id, // Our DB's unique ID
        'Company': job.company,
        'Position': job.position,
        'Status': job.status,
        'Location': job.location,
        'Salary': job.salary,
        'URL': job.url,
        'Platform': job.platform?.name,
        'ApplicationDate': job.applicationDate.toISOString(),
    }));

    // Fetch all existing records from Airtable to check for matches
    const existingAirtableRecords = await table.select({
        fields: ['jobtracker_id']
    }).all();

    const existingIds = new Map(existingAirtableRecords.map(rec => [rec.fields.jobtracker_id, rec.id]));

    const recordsToCreate: Array<{ fields: any }> = [];
    const recordsToUpdate: Array<{ id: string, fields: any }> = [];

    for (const job of jobsToSync) {
        const airtableRecordId = existingIds.get(job.jobtracker_id);
        if (airtableRecordId) {
            recordsToUpdate.push({ id: airtableRecordId, fields: job });
        } else {
            recordsToCreate.push({ fields: job });
        }
    }
    
    // Perform batch operations (Airtable's API limit is 10 records per request)
    const promises = [];
    for (let i = 0; i < recordsToCreate.length; i += 10) {
        promises.push(table.create(recordsToCreate.slice(i, i + 10), { typecast: true }));
    }
    for (let i = 0; i < recordsToUpdate.length; i += 10) {
        promises.push(table.update(recordsToUpdate.slice(i, i + 10), { typecast: true }));
    }

    await Promise.all(promises);
    return { 
        message: "Sync complete!",
        created: recordsToCreate.length,
        updated: recordsToUpdate.length,
    };
};

export const updateWebhookSettings = async (userId: string, eventType: string, targetUrl: string) => {
    // Upsert: create if it doesn't exist, update if it does
    return prisma.webhook.upsert({
        where: { userId_eventType: { userId, eventType } },
        update: { targetUrl },
        create: { userId, eventType, targetUrl },
    });
};
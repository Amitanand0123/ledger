import { prisma } from '../config/db.js';
import * as bcrypt from 'bcryptjs';

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

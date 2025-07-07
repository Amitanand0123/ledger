import { prisma } from '../config/db';

export const findPlatforms = (searchTerm?: string) => {
    return prisma.jobPlatform.findMany({
        where: {
            name: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        },
        orderBy: { name: 'asc' },
        take: 10, // Limit results for performance
    });
};

export const createPlatform = async (name: string) => {
    // Check if it already exists to avoid race conditions, though the unique constraint helps
    const existingPlatform = await prisma.jobPlatform.findUnique({
        where: { name },
    });
    if (existingPlatform) {
        return existingPlatform;
    }

    return prisma.jobPlatform.create({
        data: { name },
    });
};

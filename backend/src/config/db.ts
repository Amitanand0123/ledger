import { PrismaClient } from '@prisma/client';

/**
 * A singleton instance of the Prisma Client.
 *
 * In a development environment, globalThis is used to ensure that the Prisma Client
 * is not re-initialized on every hot reload, which can exhaust database connections.
 * In production, it simply creates one instance.
 */
const prismaClientSingleton = () => {
    return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

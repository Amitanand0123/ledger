import { db } from '../db/client.js';
import { jobPlatforms } from '../db/schema/index.js';
import { ilike, asc, eq } from 'drizzle-orm';

export const findPlatforms = async (searchTerm?: string) => {
    if (!searchTerm) {
        return db.select().from(jobPlatforms).orderBy(asc(jobPlatforms.name)).limit(10);
    }

    return db
        .select()
        .from(jobPlatforms)
        .where(ilike(jobPlatforms.name, `%${searchTerm}%`))
        .orderBy(asc(jobPlatforms.name))
        .limit(10);
};

export const createPlatform = async (name: string) => {
    const [existingPlatform] = await db
        .select()
        .from(jobPlatforms)
        .where(eq(jobPlatforms.name, name))
        .limit(1);

    if (existingPlatform) {
        return existingPlatform;
    }

    const [newPlatform] = await db
        .insert(jobPlatforms)
        .values({ name })
        .returning();

    return newPlatform;
};

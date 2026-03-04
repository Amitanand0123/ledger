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
    // Use INSERT ... ON CONFLICT to avoid race condition with concurrent requests
    const [platform] = await db
        .insert(jobPlatforms)
        .values({ name })
        .onConflictDoNothing({ target: jobPlatforms.name })
        .returning();

    if (platform) {
        return platform;
    }

    // If onConflictDoNothing returned nothing, the platform already exists
    const [existingPlatform] = await db
        .select()
        .from(jobPlatforms)
        .where(eq(jobPlatforms.name, name))
        .limit(1);

    return existingPlatform;
};

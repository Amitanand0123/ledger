// backend/src/services/sharing.service.ts

import { db } from '../db/client.js';
import { dashboardShares, users } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import ApiError from '../utils/ApiError.js';

// Share a dashboard with another user by email
export const createShare = async (ownerId: string, inviteEmail: string) => {
    const [owner] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

    if (owner?.email === inviteEmail) {
        throw new ApiError(400, 'You cannot share your own dashboard with yourself.');
    }

    const [existingShare] = await db
        .select()
        .from(dashboardShares)
        .where(
            and(eq(dashboardShares.ownerId, ownerId), eq(dashboardShares.inviteEmail, inviteEmail))
        )
        .limit(1);

    if (existingShare) {
        throw new ApiError(400, `Dashboard already shared with ${inviteEmail}.`);
    }

    const [share] = await db
        .insert(dashboardShares)
        .values({ ownerId, inviteEmail })
        .returning();

    return share;
};

// Get a list of users the owner has shared their dashboard with
export const getOwnedShares = async (ownerId: string) => {
    return db.query.dashboardShares.findMany({
        where: eq(dashboardShares.ownerId, ownerId),
        columns: {
            id: true,
            inviteEmail: true,
        },
        with: {
            viewer: {
                columns: {
                    name: true,
                    email: true,
                },
            },
        },
    });
};

// Revoke a user's access to a dashboard
export const deleteShare = async (shareId: string, ownerId: string) => {
    const [share] = await db
        .select()
        .from(dashboardShares)
        .where(and(eq(dashboardShares.id, shareId), eq(dashboardShares.ownerId, ownerId)))
        .limit(1);

    if (!share) {
        throw new ApiError(404, 'Share record not found or you do not have permission to delete it.');
    }

    const [deletedShare] = await db
        .delete(dashboardShares)
        .where(eq(dashboardShares.id, shareId))
        .returning();

    return deletedShare;
};

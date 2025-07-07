import { prisma } from '../config/db.js';
import { Prisma, TeamRole } from '@prisma/client';
import { logger } from '../utils/logger.js';

/**
 * Creates a new team and automatically makes the creator the OWNER.
 * @param userId - The ID of the user creating the team.
 * @param name - The name of the new team.
 * @returns The newly created team.
 */
export const createTeam = async (userId: string, name: string) => {
    logger.info(`User ${userId} creating team with name "${name}"`);
    return prisma.team.create({
        data: {
            name,
            members: {
                create: {
                    userId: userId,
                    role: 'OWNER'
                }
            }
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        }
    });
};

/**
 * Retrieves all teams that a specific user is a member of.
 * @param userId - The ID of the user.
 * @returns A list of teams with their members.
 */
export const getTeamsForUser = (userId: string) => {
    logger.info(`Fetching teams for user ${userId}`);
    return prisma.team.findMany({
        where: {
            members: {
                some: {
                    userId: userId
                }
            }
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                },
                orderBy: { role: 'asc' } // Owners first
            }
        }
    });
};

/**
 * Invites a new user to a team by their email address.
 * Only team owners can perform this action.
 * @param teamId - The ID of the team to invite to.
 * @param invitingUserId - The ID of the user performing the invitation.
 * @param inviteeEmail - The email of the user to be invited.
 * @param role - The role to assign to the new member (EDITOR or VIEWER).
 * @returns The new team membership record.
 */
export const inviteUserToTeam = async (teamId: string, invitingUserId: string, inviteeEmail: string, role: 'EDITOR' | 'VIEWER') => {
    logger.info(`User ${invitingUserId} attempting to invite ${inviteeEmail} to team ${teamId}`);

    // 1. Verify that the inviting user is an OWNER of the team.
    const inviterMembership = await prisma.teamMembership.findUnique({
        where: { userId_teamId: { userId: invitingUserId, teamId } }
    });
    if (!inviterMembership || inviterMembership.role !== 'OWNER') {
        throw new Error("Permission denied: Only team owners can invite new members.");
    }

    // 2. Find the user to be invited by their email.
    const userToInvite = await prisma.user.findUnique({
        where: { email: inviteeEmail }
    });
    if (!userToInvite) {
        throw new Error(`User with email ${inviteeEmail} not found.`);
    }

    // 3. Check if the user is already a member of the team.
    const existingMembership = await prisma.teamMembership.findUnique({
        where: { userId_teamId: { userId: userToInvite.id, teamId } }
    });
    if (existingMembership) {
        throw new Error(`User ${inviteeEmail} is already a member of this team.`);
    }

    // 4. Create the new membership record.
    logger.info(`Adding user ${userToInvite.id} to team ${teamId} with role ${role}`);
    return prisma.teamMembership.create({
        data: {
            teamId,
            userId: userToInvite.id,
            role,
        }
    });
};

/**
 * Removes a user from a team.
 * Only team owners can perform this action. An owner cannot remove themselves.
 * @param teamId - The ID of the team.
 * @param removingUserId - The ID of the user performing the removal.
 * @param memberIdToRemove - The ID of the user to be removed.
 */
export const removeUserFromTeam = async (teamId: string, removingUserId: string, memberIdToRemove: string) => {
    logger.info(`User ${removingUserId} attempting to remove user ${memberIdToRemove} from team ${teamId}`);
    
    // An owner cannot remove themselves
    if (removingUserId === memberIdToRemove) {
        throw new Error("Team owners cannot remove themselves.");
    }

    // 1. Verify that the user performing the action is an OWNER.
    const removerMembership = await prisma.teamMembership.findUnique({
        where: { userId_teamId: { userId: removingUserId, teamId } }
    });
    if (!removerMembership || removerMembership.role !== 'OWNER') {
        throw new Error("Permission denied: Only team owners can remove members.");
    }

    // 2. Delete the membership record for the user being removed.
    return prisma.teamMembership.delete({
        where: {
            userId_teamId: {
                userId: memberIdToRemove,
                teamId: teamId
            }
        }
    });
};

/**
 * A utility function to check a user's permission level for a given team.
 * This is crucial for securing other services (like the job service).
 * @param userId - The ID of the user.
 * @param teamId - The ID of the team.
 * @returns The user's role in the team, or null if they are not a member.
 */
export const checkUserTeamPermission = async (userId: string, teamId: string): Promise<TeamRole | null> => {
    const membership = await prisma.teamMembership.findUnique({
        where: {
            userId_teamId: { userId, teamId }
        },
        select: { role: true }
    });
    return membership?.role || null;
};
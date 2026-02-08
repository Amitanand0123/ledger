/**
 * Job application status constants
 * These must match the JobStatus enum in Prisma schema
 */

export const JobStatus = {
    // Pre-Application Statuses
    INTERESTED: 'INTERESTED',
    PREPARING: 'PREPARING',
    READY_TO_APPLY: 'READY_TO_APPLY',

    // Post-Application Statuses
    APPLIED: 'APPLIED',
    OA: 'OA',
    INTERVIEW: 'INTERVIEW',
    OFFER: 'OFFER',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
} as const;

export type JobStatusType = typeof JobStatus[keyof typeof JobStatus];

/**
 * Check if a status is a pre-application status
 */
export function isPreApplicationStatus(status: string): boolean {
    return ['INTERESTED', 'PREPARING', 'READY_TO_APPLY'].includes(status);
}

/**
 * Check if a status is a post-application status
 */
export function isPostApplicationStatus(status: string): boolean {
    return ['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(status);
}

/**
 * Check if a status is a final status (no further progression expected)
 */
export function isFinalStatus(status: string): boolean {
    return ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(status);
}

/**
 * Get all valid job statuses
 */
export function getAllStatuses(): JobStatusType[] {
    return Object.values(JobStatus);
}

/**
 * Get human-readable status description
 */
export function getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
        INTERESTED: 'Found a job you want to apply to',
        PREPARING: 'Working on application materials',
        READY_TO_APPLY: 'Application optimized and ready',
        APPLIED: 'Application submitted',
        OA: 'Online assessment received',
        INTERVIEW: 'Interview scheduled',
        OFFER: 'Job offer received',
        ACCEPTED: 'Offer accepted',
        REJECTED: 'Application rejected',
        WITHDRAWN: 'Withdrew application',
    };

    return descriptions[status] || 'Unknown status';
}

/**
 * Validate that a status string is valid
 */
export function isValidStatus(status: string): status is JobStatusType {
    return getAllStatuses().includes(status as JobStatusType);
}

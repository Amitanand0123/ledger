import { Request } from 'express';

/**
 * Authenticated request with user object attached by auth middleware
 */
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

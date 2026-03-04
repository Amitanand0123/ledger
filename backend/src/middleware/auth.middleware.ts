import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import config from '../config/index.js';
import { UnauthorizedError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const protect = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret: string = config.jwtSecret!;
            const decoded = jwt.verify(token!, secret) as unknown as { id: string; type?: string };

            // Reject refresh tokens used as access tokens
            if (decoded.type === 'refresh') {
                throw new UnauthorizedError('Cannot use refresh token for authentication');
            }

            const [user] = await db
                .select({ id: users.id, name: users.name, email: users.email })
                .from(users)
                .where(eq(users.id, decoded.id))
                .limit(1);

            if (!user) {
                throw new UnauthorizedError('Not authorized, user not found');
            }

            req.user = user;
            return next();
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            logger.warn('Token verification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new UnauthorizedError('Not authorized, token failed');
        }
    }

    if (!token) {
        throw new UnauthorizedError('Not authorized, no token provided');
    }
});

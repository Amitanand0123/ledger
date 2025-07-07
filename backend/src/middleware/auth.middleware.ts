import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import config from '../config/index.js';

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT from the Authorization header.
 * If valid, attaches the user object to the request.
 * If invalid or not present, throws a 401 Unauthorized error.
 */
export const protect = asyncHandler(
    async (req: any, res: Response, next: NextFunction) => {
        let token;

        // Check if the Authorization header exists and starts with "Bearer"
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            try {
                // Extract the token from the header (e.g., "Bearer <token>")
                token = req.headers.authorization.split(' ')[1];

                // Verify the token using the secret key 
                const decoded: any = jwt.verify(token, config.jwtSecret!);

                // Use the ID from the decoded token to find the user in the database.
                // We explicitly select which fields to return, excluding the password hash for security.
                req.user = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: { id: true, name: true, email: true },
                });

                // If the user associated with the token no longer exists (e.g., deleted account)
                if (!req.user) {
                    res.status(401);
                    throw new Error('Not authorized, user not found');
                }

                // If everything is successful, proceed to the next middleware or route handler
                next();
            } catch (error) {
                console.error('Token verification failed:', error);
                res.status(401);
                throw new Error('Not authorized, token failed');
            }
        }

        // If no token is found in the header at all
        if (!token) {
            res.status(401);
            throw new Error('Not authorized, no token provided');
        }
    }
);

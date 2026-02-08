import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'An unexpected internal server error occurred.';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;

        if (err.isOperational) {
            logger.warn(`[${err.name}] ${err.message}`, {
                statusCode,
                path: req.path,
                method: req.method,
            });
        } else {
            logger.error(`[${err.name}] ${err.message}`, err);
        }
    } else if (err.message) {
        // Handle plain Error objects thrown with res.status() pattern (legacy support)
        const resStatusCode = res.statusCode !== 200 ? res.statusCode : 500;
        statusCode = resStatusCode;
        message = err.message;

        if (statusCode >= 500) {
            logger.error('Unhandled server error', err);
        } else {
            logger.warn(`Client error: ${err.message}`, {
                statusCode,
                path: req.path,
                method: req.method,
            });
        }
    } else {
        logger.error('Unknown error', err);
    }

    const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

    res.status(statusCode).json({
        success: false,
        message,
        ...(stack && { stack }),
    });
};
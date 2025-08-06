import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';

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
    } else {
        // Log the original unexpected error for debugging purposes
        console.error('UNHANDLED ERROR:', err);
    }
    
    // In development, you might want to see the stack trace
    const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

    res.status(statusCode).json({
        message,
        stack, // Will be undefined in production
    });
};
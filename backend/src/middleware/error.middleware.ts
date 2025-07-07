import { Request, Response, NextFunction } from 'express';

/**
 * Global Express error handling middleware.
 * Catches errors from async handlers and standard middleware.
 * Formats the error response into a consistent JSON object.
 * Hides the stack trace in production environments for security.
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Determine the status code. If the response already has a status code (e.g., set by a controller to 400),
    // use that. Otherwise, default to 500 (Internal Server Error).
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode);

    // Send back a JSON response with the error details.
    res.json({
        message: err.message,
        // The stack trace is useful for debugging but should not be exposed in production.
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

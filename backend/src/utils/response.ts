import { Response } from 'express';

interface SendSuccessOptions {
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Sends a standardized success response.
 *
 * Shape: { success: true, data: T, message?: string, pagination?: object }
 */
export function sendSuccess<T>(
    res: Response,
    statusCode: number,
    data: T,
    options?: SendSuccessOptions
): void {
    const response: Record<string, unknown> = { success: true, data };
    if (options?.message) response.message = options.message;
    if (options?.pagination) response.pagination = options.pagination;
    res.status(statusCode).json(response);
}

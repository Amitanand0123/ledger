import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { getUploadPresignedUrl } from '../services/s3.service.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

// Allowed file types for uploads
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validates file upload parameters
 */
function validateFileUpload(filename: string, contentType: string): { valid: boolean; error?: string } {
    // Validate file extension
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
            valid: false,
            error: `Invalid content type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        };
    }

    // Validate filename format (no path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return {
            valid: false,
            error: 'Invalid filename format',
        };
    }

    return { valid: true };
}

export const generateUploadUrl = asyncHandler(
    async (req: any, res: Response) => {
        const { filename, contentType, fileSize } = req.body;

        // Validate required fields
        if (!filename || !contentType) {
            throw new ValidationError('Filename and contentType are required.');
        }

        // Validate file size
        if (fileSize && fileSize > MAX_FILE_SIZE) {
            throw new ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        // Validate file type and extension
        const validation = validateFileUpload(filename, contentType);
        if (!validation.valid) {
            throw new ValidationError(validation.error || 'Invalid file');
        }

        const { signedUrl, key } = await getUploadPresignedUrl(
            req.user.id,
            filename,
            contentType
        );

        sendSuccess(res, 200, { signedUrl, key });
    }
);

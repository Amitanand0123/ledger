import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { getUploadPresignedUrl } from '../services/s3.service';

/**
 * @desc    Generate a secure, presigned URL for direct S3 file upload
 * @route   POST /api/v1/uploads/presigned-url
 * @access  Private
 */
export const generateUploadUrl = asyncHandler(
    async (req: any, res: Response) => {
        const { filename, contentType } = req.body;
        if (!filename || !contentType) {
            res.status(400);
            throw new Error('Filename and contentType are required.');
        }

        const { signedUrl, key } = await getUploadPresignedUrl(
            req.user.id,
            filename,
            contentType
        );

        res.status(200).json({ signedUrl, key });
    }
);

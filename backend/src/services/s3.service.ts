import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generates a secure, temporary URL that grants the frontend permission
 * to upload a file directly to our S3 bucket.
 */
export const getUploadPresignedUrl = async (
    userId: string,
    originalFilename: string,
    contentType: string
) => {
    // Generate a unique, random name for the file to prevent name collisions
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const key = `uploads/${userId}/${randomBytes}-${originalFilename}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        // Add metadata if needed
        Metadata: {
            'original-filename': originalFilename,
            'user-id': userId,
        },
    });

    // The URL is valid for a limited time (e.g., 15 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 900,
        // Ensure the signed URL works with CORS
        signableHeaders: new Set(['host']),
    });

    return { signedUrl, key };
};
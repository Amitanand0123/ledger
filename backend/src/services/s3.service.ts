import { logger } from '@/utils/logger';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

export const getTextFromS3 = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);
        // The body is a readable stream. We need to convert it to a string.
        return response.Body?.transformToString('utf-8') || '';
    } catch (error) {
        console.error(`Failed to get object from S3 with key: ${key}`, error);
        throw new Error('Could not retrieve file from storage.');
    }
};

export const getFileBufferFromS3 = async (key: string): Promise<Buffer | null> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);
        // The body is a readable stream. We need to convert it into a byte array (Buffer).
        const byteArray = await response.Body?.transformToByteArray();
        return byteArray ? Buffer.from(byteArray) : null;
    } catch (error) {
        logger.error(`Failed to get object from S3 with key: ${key}`, error);
        throw new Error('Could not retrieve file from storage.');
    }
};

/**
 * Deletes an object from the S3 bucket.
 * This is a critical function to call when a document record is deleted from the database.
 */
export const deleteObjectFromS3 = async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        await s3Client.send(command);
        logger.info(`Successfully deleted object from S3 with key: ${key}`);
    } catch (error) {
        logger.error(`Failed to delete object from S3 with key: ${key}`, error);
        // Do not throw an error that stops the user flow, just log it.
        // The record in the DB will be deleted anyway.
    }
};

/**
 * Generates a secure, temporary URL for downloading a file from S3.
 * The URL is valid for a short period (e.g., 5 minutes).
 * @param key The S3 object key.
 * @returns A pre-signed URL string.
 */
export const getDownloadPresignedUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        // The URL will be valid for 300 seconds (5 minutes)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        return signedUrl;
    } catch (error) {
        logger.error(`Failed to generate pre-signed download URL for key: ${key}`, error);
        throw new Error('Could not generate secure download link.');
    }
};

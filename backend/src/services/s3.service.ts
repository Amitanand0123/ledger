import { logger } from '@/utils/logger.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export const getUploadPresignedUrl = async (
    userId: string,
    originalFilename: string,
    contentType: string,
    maxFileSize?: number
) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const key = `uploads/${userId}/${randomBytes}-${originalFilename}`;

    const commandInput: any = {
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Metadata: {
            'original-filename': originalFilename,
            'user-id': userId,
        },
    };
    if (maxFileSize) {
        commandInput.ContentLength = maxFileSize;
    }
    const command = new PutObjectCommand(commandInput);
    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900,
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
        return response.Body?.transformToString('utf-8') || '';
    } catch (error) {
        logger.error(`Failed to get object from S3 with key: ${key}`, error);
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
        const byteArray = await response.Body?.transformToByteArray();
        return byteArray ? Buffer.from(byteArray) : null;
    } catch (error) {
        logger.error(`Failed to get object from S3 with key: ${key}`, error);
        throw new Error('Could not retrieve file from storage.');
    }
};

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
        throw new Error('Could not delete file from storage.');
    }
};

export const getDownloadPresignedUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        return signedUrl;
    } catch (error) {
        logger.error(`Failed to generate pre-signed download URL for key: ${key}`, error);
        throw new Error('Could not generate secure download link.');
    }
};

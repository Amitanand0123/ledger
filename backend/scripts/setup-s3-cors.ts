import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

async function setupCORS() {
    console.log(`Setting up CORS for bucket: ${BUCKET_NAME}...`);

    const corsConfiguration = {
        CORSRules: [
            {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: [
                    'http://localhost:3022',
                    'http://127.0.0.1:3022',
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    // Add your production domain here when deploying
                    // 'https://yourdomain.com',
                ],
                ExposeHeaders: [
                    'ETag',
                    'x-amz-meta-original-filename',
                    'x-amz-meta-user-id',
                ],
                MaxAgeSeconds: 3000,
            },
        ],
    };

    try {
        const command = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: corsConfiguration,
        });

        await s3Client.send(command);
        console.log('✅ CORS configuration successfully applied!');
        console.log('You can now upload files from your frontend.');
    } catch (error) {
        console.error('❌ Failed to set CORS configuration:', error);
        process.exit(1);
    }
}

setupCORS();

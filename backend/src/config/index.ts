import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: process.env.PORT || '5000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3022',
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3BucketName: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
    },

    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
    },
    aiServiceUrl: process.env.AI_SERVICE_URL,
    aiServiceApiKey: process.env.AI_SERVICE_API_KEY,

    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || '587',
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
};

if (!config.jwtSecret || !config.databaseUrl || !config.gemini.apiKey) {
    console.error(
        'FATAL ERROR: JWT_SECRET, DATABASE_URL, and GEMINI_API_KEY must be defined in the environment variables.'
    );
    process.exit(1);
}

export default config;

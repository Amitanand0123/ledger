import dotenv from 'dotenv';

// Load environment variables from .env file at the root of the backend project
dotenv.config();

/**
 * A centralized configuration object that pulls values from environment variables.
 * Provides default values for non-critical settings during development.
 */
const config = {
    // Application settings
    port: process.env.PORT || '5000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3021',

    // Security settings
    jwtSecret: process.env.JWT_SECRET,

    // Database and Service URLs
    databaseUrl: process.env.DATABASE_URL,

    // AWS S3 Credentials for Document Uploads
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3BucketName: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
    },

    // Google Calendar API Credentials
    google: {
        clientId: process.env.GCAL_CLIENT_ID,
        clientSecret: process.env.GCAL_CLIENT_SECRET,
        redirectUri: process.env.GCAL_REDIRECT_URI,
    },

    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
    },
};

// --- Validation ---
// A simple check to ensure critical environment variables are set before the app starts.
// In a production environment, you would have a more robust validation schema (e.g., using Zod).
if (!config.jwtSecret || !config.databaseUrl || !config.gemini.apiKey) {
    console.error(
        'FATAL ERROR: JWT_SECRET, DATABASE_URL, and GEMINI_API_KEY must be defined in the environment variables.'
    );
}

export default config;

import express, { Express, Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';
import apiRoutes from './api/index.js';
import config from './config/index.js';

const app: Express = express();

// --- Security & Core Middleware ---

// Set security-related HTTP headers
app.use(helmet());

// Enable CORS for the client application
app.use(
    cors({
        origin: config.clientUrl,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','OPTIONS'],
        allowedHeaders: [
            'Content-Type', 
            'Authorization', 
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
    })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
// Apply to all API routes to prevent abuse
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// --- Routes ---

// Simple health check route
const healthHandler: RequestHandler = (req, res) => {
    res.status(200).send('OK');
};
app.get('/health', healthHandler);
 
// Main API routes
app.use('/api/v1', apiRoutes);

// --- Error Handling ---
// This should be the last middleware
app.use(errorHandler);

export default app;
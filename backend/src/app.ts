import express, { Express, Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';
import apiRoutes from './api/index.js';
import healthRoutes from './api/routes/health.routes.js';
import config from './config/index.js';

const app: Express = express();


app.use(helmet());

const allowedOrigins = config.clientUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (
                !origin ||
                allowedOrigins.includes(origin) ||
                // Allow Vercel preview deployments only for configured project slugs
                allowedOrigins.some((allowed) => {
                    if (!allowed.endsWith('.vercel.app') || !origin.endsWith('.vercel.app')) return false;
                    // Extract the project slug from the allowed origin (e.g., "ledger-app" from "ledger-app-gamma.vercel.app")
                    const allowedHost = allowed.replace(/^https?:\/\//, '');
                    const projectSlug = allowedHost.split('.')[0].replace(/-[a-z0-9]+$/, '');
                    const originHost = origin.replace(/^https?:\/\//, '');
                    return originHost.startsWith(projectSlug);
                })
            ) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Health check endpoints (before rate limiting)
app.use('/', healthRoutes);

app.use('/api/v1', apiRoutes);

app.use(errorHandler);

export default app;
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

app.use(
    cors({
        origin: [
            config.clientUrl,
        ],
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
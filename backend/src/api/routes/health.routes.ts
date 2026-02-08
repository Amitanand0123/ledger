// Health check routes for monitoring and load balancers
// Based on hiremaze health check pattern

import { Router, Request, Response } from 'express';
import { db } from '../../db/client.js';
import { sql } from 'drizzle-orm';
import { logger } from '@/utils/logger.js';

const router = Router();

/**
 * Basic health check endpoint
 * Returns 200 if server is responsive
 */
router.get('/health', (req: Request, res: Response) => {
    try {
        res.status(200).json({
            status: 'ok',
            message: 'API server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Service unavailable',
        });
    }
});

/**
 * Readiness check endpoint
 * Checks all critical dependencies (database, etc.)
 * Used by load balancers and orchestration tools
 */
router.get('/health/ready', async (req: Request, res: Response) => {
    const checks = {
        database: false,
        timestamp: new Date().toISOString(),
    };

    try {
        // Check database connection
        await db.execute(sql`SELECT 1`);
        checks.database = true;

        // All checks passed
        if (checks.database) {
            res.status(200).json({
                status: 'ready',
                message: 'Service is ready to handle requests',
                checks,
            });
        } else {
            res.status(503).json({
                status: 'not ready',
                message: 'Service dependencies are not ready',
                checks,
            });
        }
    } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not ready',
            message: 'Service dependencies are not ready',
            checks,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Liveness check endpoint
 * Simpler check just to verify the process is alive
 * Used by container orchestrators (Kubernetes, ECS, etc.)
 */
router.get('/health/live', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});

export default router;

import app from './app.js';
import config from './config/index.js';
import { logger } from './utils/logger.js';
import { createServer } from 'http';
import { initializeSocket } from './socket.js';
import { initializeEmailService } from './services/email.service.js';
import { initializeReminderCron } from './services/reminder.service.js';
import { validateEnv } from './config/env.validation.js';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';

const PORT = Number(config.port) || 5000;

// Validate environment variables before starting server
validateEnv();

async function startServer() {
    const httpServer = createServer(app);

    const io = initializeSocket(httpServer);

    app.set('io', io);

    // Verify critical DB tables exist
    try {
        const result = await db.execute(sql`SELECT to_regclass('public."RefreshToken"') as exists`);
        const tableExists = (result as any)[0]?.exists;
        if (!tableExists) {
            logger.error('CRITICAL: "RefreshToken" table does not exist! Run: npm run db:push');
        } else {
            logger.info('Database schema verified (RefreshToken table exists).');
        }
    } catch (dbErr) {
        logger.error('Failed to verify database schema', dbErr as Error);
    }

    try {
        await initializeEmailService();
        logger.info('All background services connected successfully.');
    } catch (error) {
        logger.error(
            'Failed to connect to one or more background services:',
            error
        );
        process.exit(1);
    }

    // Initialize reminder cron job
    initializeReminderCron();

    const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

    httpServer.listen(PORT, HOST, () => {
        logger.info(`Backend server is running on http://${HOST}:${PORT}`);
    });
}

startServer();

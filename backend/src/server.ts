import app from './app';
import config from './config';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { initializeSocket } from './socket';
import { initializeEmailService } from './services/email.service';

const PORT = config.port || 5000;

async function startServer() {
    // Create an HTTP server from the Express app instance
    const httpServer = createServer(app);

    // Initialize the Socket.IO server and attach it to the HTTP server
    const io = initializeSocket(httpServer);

    // Make the `io` instance globally accessible to other parts of the app (like services)
    // by attaching it to the Express app object.
    app.set('io', io);

    // Start all necessary background connections concurrently
    try {
        await initializeEmailService();
        logger.info('All background services connected successfully.');
    } catch (error) {
        logger.error(
            'Failed to connect to one or more background services:',
            error
        );
        process.exit(1); // Exit if critical services can't connect
    }

    // Start listening for incoming HTTP requests
    httpServer.listen(PORT, () => {
        logger.info(`🚀 Backend server is running on http://localhost:${PORT}`);
    });
}

startServer();

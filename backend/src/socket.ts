import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import config from './config/index.js';
import { logger } from './utils/logger.js';

interface AuthenticatedSocket extends Socket {
    userId: string;
}
export function initializeSocket(httpServer: HttpServer): Server {
    if (!config.jwtSecret) {
        throw new Error('JWT_SECRET is not configured. Please check environment variables.');
    }
    const io = new Server(httpServer, {
        cors: {
            origin: config.clientUrl.split(',').map(url => url.trim()).filter(Boolean),
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided.'));
        }
        
        jwt.verify(token, config.jwtSecret!, (err: any, decoded: any) => { 
            if (err) {
                logger.warn(`Socket authentication failed: ${err.message}`);
                return next(new Error('Authentication error: Invalid token.'));
            }
            (socket as AuthenticatedSocket).userId = decoded.id;
            next();
        });
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as AuthenticatedSocket).userId;

        socket.join(userId);
    });

    return io;
}

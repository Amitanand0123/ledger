import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import config from './config';
import { logger } from './utils/logger';
export function initializeSocket(httpServer: HttpServer): Server {
    if (!config.jwtSecret) {
        throw new Error('JWT_SECRET is not configured. Please check environment variables.');
    }
    const io = new Server(httpServer, {
        cors: {
            origin: config.clientUrl,
            methods: ['GET', 'POST'],
        },
    });

    // Middleware for authenticating new socket connections using the JWT
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
            // Attach user and team info to the socket for later use
            (socket as any).userId = decoded.id;
            next();
        });
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;

        // A user joins their own personal room
        socket.join(userId);

        // A user can also request to join team rooms
        socket.on('join_team_room', (teamId) => {
            // In a real app, you would verify the user is actually a member of this team first
            socket.join(`team_${teamId}`);
            logger.info(`Socket ${socket.id} joined team room: team_${teamId}`);
        });
    });

    return io;
}

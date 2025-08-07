import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * A custom React hook to manage a Socket.IO connection.
 * It automatically connects when a user session is available and sends the JWT for authentication.
 * It handles cleanup and disconnection when the component unmounts or the user logs out.
 * @returns {Socket | null} The active Socket.IO instance, or null if not connected.
 */
export const useSocket = (): Socket | null => {
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && session?.accessToken) {
            const newSocket = io(socketUrl, {
                auth: {
                    token: session.accessToken,
                },
                reconnection: true,
                reconnectionAttempts: 5,
            });

            newSocket.on('connect', () => {
                console.log('Socket.IO Client Connected:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket.IO Connection Error:', err.message);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket.IO Client Disconnected.');
            });

            setSocket(newSocket);
            
            return () => {
                newSocket.disconnect();
            };
        } else {
            if(socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [status, session, socket]);

    return socket;
};
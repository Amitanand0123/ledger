import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useSocket = (): Socket | null => {
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Only run this effect if the user is authenticated.
        if (status === 'authenticated' && session?.accessToken) {
            // Create the new socket connection.
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
                console.log('Disconnecting socket...');
                newSocket.disconnect();
            };
        }
    }, [status, session]);

    return socket;
};
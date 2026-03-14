import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

            if (process.env.NODE_ENV === 'development') {
                newSocket.on('connect', () => console.log('Socket.IO Connected:', newSocket.id));
                newSocket.on('connect_error', (err) => console.error('Socket.IO Error:', err.message));
                newSocket.on('disconnect', () => console.log('Socket.IO Disconnected.'));
            }
            setSocket(newSocket);
            return () => {
                newSocket.disconnect();
            };
        }
    }, [status, session?.accessToken]);

    return socket;
};
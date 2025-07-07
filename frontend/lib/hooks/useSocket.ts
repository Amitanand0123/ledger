import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Get the backend URL from environment variables, with a fallback for local development
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
        // Only attempt to connect if the session has been loaded and is authenticated
        if (status === 'authenticated' && session?.accessToken) {
            
            // Establish the connection, passing the JWT in the 'auth' payload.
            // This is received by the socket middleware on the backend.
            const newSocket = io(socketUrl, {
                auth: {
                    token: session.accessToken
                },
                // Reconnection attempts are useful for handling temporary network issues
                reconnection: true,
                reconnectionAttempts: 5
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
            
            // Cleanup function: This will be called when the component unmounts
            // or when the dependencies of the useEffect hook (i.e., `status`) change.
            return () => {
                newSocket.disconnect();
            };
        } else {
            // If the user is not authenticated or is logging out, ensure any existing socket is disconnected.
            if(socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [status, session]); // Rerun this effect only when the session status or data changes

    return socket;
};
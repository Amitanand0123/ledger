import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Assumes your NextAuth config is in lib/auth.ts

/**
 * The NextAuth.js API route handler.
 * This file creates the /api/auth/* endpoints (like /api/auth/signin, /api/auth/signout, /api/ouath/session)
 * that are used by the NextAuth.js client for all authentication operations.
 * It's purely a server-side API endpoint and does not contain any visual components.
 */
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests, as NextAuth uses both.
export { handler as GET, handler as POST };
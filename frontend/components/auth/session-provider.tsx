'use client';

import { SessionProvider } from 'next-auth/react';

interface NextAuthProviderProps {
  children: React.ReactNode;
}

// This component wraps the entire application in the `app/layout.tsx` file.
// It uses the SessionProvider from next-auth/react to make the session data
// (e.g., user's name, email, access token) available globally via the `useSession` hook.
export default function NextAuthProvider({ children }: NextAuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
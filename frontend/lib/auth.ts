import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// INTERNAL_API_URL is a server-only env var (not baked at build time by Next.js).
// In Docker, this resolves to the internal network URL (e.g., http://backend:5000).
// Falls back to NEXT_PUBLIC_API_URL for local development.
const apiBaseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
if (!apiBaseUrl) {
    throw new Error('FATAL: INTERNAL_API_URL or NEXT_PUBLIC_API_URL environment variable is not set. Application cannot start without a backend URL.');
}

interface CustomUser extends NextAuthUser {
  token?: string;
  refreshToken?: string;
  _id?: string;
}

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const result = await response.json();
    const refreshedTokens = result.data;

    return {
      ...token,
      accessToken: refreshedTokens.token,
      refreshToken: refreshedTokens.refreshToken,
      accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) return null;
          const response = await res.json();
          if (response && response.success && response.data) {
            const userData = response.data;
            return {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              token: userData.token,
              refreshToken: userData.refreshToken,
            };
          }
          return null;
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              provider: 'google',
              providerAccountId: user.id,
            }),
          });

          if (!res.ok) {
            return false;
          }

          const response = await res.json();
          if (response && response.success && response.data) {
            const backendUser = response.data;
            (user as CustomUser).token = backendUser.token;
            (user as CustomUser).refreshToken = backendUser.refreshToken;
            (user as CustomUser)._id = backendUser.id;
            return true;
          }

          return false;

        } catch (error) {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      const customUser = user as CustomUser;

      // Initial sign in
      if (customUser) {
        token.accessToken = customUser.token;
        token.refreshToken = customUser.refreshToken;
        token.id = customUser._id || customUser.id;
        token.name = customUser.name;
        token.email = customUser.email;
        token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      // When update() is called, fetch fresh user data from backend (must be before expiry check)
      if (trigger === 'update' && token.accessToken) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
            },
          });
          if (res.ok) {
            const response = await res.json();
            const userData = response.data;
            token.name = userData.name;
            token.email = userData.email;
            token.onboardingCompleted = userData.onboardingCompleted;
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
        return token;
      }

      // Fetch onboarding status on first login
      if (token.onboardingCompleted === undefined && token.accessToken && customUser) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
            },
          });
          if (res.ok) {
            const response = await res.json();
            const userData = response.data;
            token.onboardingCompleted = userData.onboardingCompleted;
          }
        } catch (error) {
          console.error('Error fetching onboarding status:', error);
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        if (session.user) {
            session.user.id = token.id as string;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.onboardingCompleted = token.onboardingCompleted;
        }
        // Pass error to the client
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    },
  },
};

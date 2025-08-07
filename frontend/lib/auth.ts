import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Define a new interface for the user object to include our custom properties
interface CustomUser extends NextAuthUser {
  token?: string;
  _id?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email/Password Credentials Provider
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
          const user = await res.json();
          if (user && user.token) return user;
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
    /**
     * This callback is called when a user signs in.
     * For Google OAuth, we use it to talk to our backend to create/update the user
     * and get our own application-specific JWT.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          console.log('Attempting Google OAuth backend call...');
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
            const errorBody = await res.text();
            console.error(`Backend OAuth failed with status ${res.status}:`, errorBody);
            return false; // This is what triggers the OAuthSignin error
          }

          const backendUser = await res.json();
          console.log('Backend OAuth successful:', backendUser);

          // Inject our backend token and user ID into the user object
          // so the `jwt` callback can access them.
          if (backendUser.token) {
            (user as CustomUser).token = backendUser.token;
            (user as CustomUser)._id = backendUser._id;
            return true;
          }

          console.error('Backend response missing token.');
          return false;

        } catch (error) {
          console.error('CRITICAL: Error during Google Sign In callback fetch:', error);
          return false;
        }
      }
      return true; // For other providers like credentials
    },

    /**
     * The `jwt` callback is executed whenever a JSON Web Token is created or updated.
     */
    async jwt({ token, user }) {
      // The `user` object is what's returned from `authorize` or the `signIn` callback.
      const customUser = user as CustomUser;
      if (customUser) {
        token.accessToken = customUser.token;
        token.id = customUser._id;
        token.name = customUser.name;
        token.email = customUser.email;
      }
      return token;
    },

    /**
     * The `session` callback builds the session object exposed to the client.
     */
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        if (session.user) {
            session.user.id = token.id as string;
            session.user.name = token.name;
            session.user.email = token.email;
        }
      }
      return session;
    },
  },
};
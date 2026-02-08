import { z } from 'zod';

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters long')
            .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
        email: z
            .string()
            .email('Invalid email format'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters long')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
    }),
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Invalid email format'),
        password: z
            .string()
            .min(1, 'Password is required'),
    }),
});

/**
 * Schema for OAuth authentication
 */
export const oAuthSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        name: z.string().min(1, 'Name is required'),
        provider: z.string().min(1, 'Provider is required'),
        providerAccountId: z.string().min(1, 'Provider account ID is required'),
    }),
});

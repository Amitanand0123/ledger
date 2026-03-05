import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db/client.js';
import { users, accounts, refreshTokens } from '../db/schema/index.js';
import { eq, and, lt } from 'drizzle-orm';
import config from '../config/index.js';
import { logger } from '@/utils/logger.js';
import { validatePassword, validateEmail, validateName } from '../utils/validation.js';
import { ValidationError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const generateAccessToken = (id: string) => {
    return jwt.sign({ id, type: 'access' }, config.jwtSecret!, { expiresIn: '1h' });
};

const generateRefreshToken = (id: string) => {
    return jwt.sign({ id, type: 'refresh' }, config.jwtSecret!, { expiresIn: '30d' });
};

const saveRefreshToken = async (token: string, userId: string) => {
    try {
        await db.insert(refreshTokens).values({
            token,
            userId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    } catch (err: unknown) {
        // Log the FULL postgres error details for debugging
        const pgErr = err as any;
        logger.error('RefreshToken insert failed', {
            message: pgErr?.message,
            code: pgErr?.code,
            detail: pgErr?.detail,
            severity: pgErr?.severity,
            constraint: pgErr?.constraint,
            table: pgErr?.table,
            cause: pgErr?.cause ? String(pgErr.cause) : undefined,
        });
        throw err;
    }
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        throw new ValidationError('Please provide all required fields: name, email, password.');
    }

    // Validate name format
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
        throw new ValidationError(nameValidation.message);
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        throw new ValidationError(emailValidation.message);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.message);
    }

    // Check if user already exists
    const [userExists] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (userExists) {
        throw new ConflictError('User with this email already exists.');
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const [user] = await db
        .insert(users)
        .values({ name, email, password: hashedPassword })
        .returning();

    if (user) {
        const refreshToken = generateRefreshToken(user.id);
        await saveRefreshToken(refreshToken, user.id);

        logger.info(`New user registered: ${user.email}`);
        sendSuccess(res, 201, {
            id: user.id,
            name: user.name,
            email: user.email,
            token: generateAccessToken(user.id),
            refreshToken,
        });
    } else {
        throw new ValidationError('Invalid user data provided.');
    }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user && (await bcrypt.compare(password, user.password))) {
        const refreshToken = generateRefreshToken(user.id);
        await saveRefreshToken(refreshToken, user.id);

        sendSuccess(res, 200, {
            id: user.id,
            name: user.name,
            email: user.email,
            token: generateAccessToken(user.id),
            refreshToken,
        });
    } else {
        throw new UnauthorizedError('Invalid email or password.');
    }
});

export const handleOAuth = asyncHandler(async (req: Request, res: Response) => {
    const { email, name, provider, providerAccountId } = req.body;
    if (!email || !name || !provider || !providerAccountId) {
        throw new ValidationError('Missing required OAuth fields: email, name, provider, providerAccountId.');
    }

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
        logger.info(`Existing user ${email} found. Linking provider ${provider}.`);

        // Check if account already exists using compound unique key
        const [accountExists] = await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
            .limit(1);

        if (!accountExists) {
            await db.insert(accounts).values({
                userId: user.id,
                type: 'oauth',
                provider,
                providerAccountId,
            });
            logger.info(`Provider ${provider} linked successfully for user ${email}.`);
        }
    } else {
        logger.info(`No user found for ${email}. Creating new user.`);

        // Create user and account in a transaction
        user = await db.transaction(async (tx) => {
            // OAuth users get an unguessable random password to prevent password-based login
            const oauthPlaceholderPassword = await bcrypt.hash(crypto.randomUUID(), 10);
            const [newUser] = await tx
                .insert(users)
                .values({
                    email,
                    name,
                    password: oauthPlaceholderPassword,
                })
                .returning();

            await tx.insert(accounts).values({
                userId: newUser.id,
                type: 'oauth',
                provider,
                providerAccountId,
            });

            return newUser;
        });

        logger.info(`New user ${email} created via OAuth.`);
    }

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(refreshToken, user.id);

    sendSuccess(res, 200, {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateAccessToken(user.id),
        refreshToken,
    });
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new ValidationError('Refresh token is required.');
    }

    // Verify the refresh token JWT
    let decoded: { id: string; type: string };
    try {
        decoded = jwt.verify(refreshToken, config.jwtSecret!) as { id: string; type: string };
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type.');
    }

    // Check if refresh token exists in DB
    const [storedToken] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken))
        .limit(1);

    if (!storedToken || storedToken.expiresAt < new Date()) {
        // If token was in DB but expired, clean it up
        if (storedToken) {
            await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
        }
        throw new UnauthorizedError('Refresh token expired or revoked.');
    }

    // Rotate: delete old, create new
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

    const newRefreshToken = generateRefreshToken(decoded.id);
    await saveRefreshToken(newRefreshToken, decoded.id);

    sendSuccess(res, 200, {
        token: generateAccessToken(decoded.id),
        refreshToken: newRefreshToken,
    });
});

export const getMe = asyncHandler(async (req: any, res: Response) => {
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
            onboardingCompleted: users.onboardingCompleted,
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

    if (!user) {
        throw new NotFoundError('User');
    }
    sendSuccess(res, 200, user);
});

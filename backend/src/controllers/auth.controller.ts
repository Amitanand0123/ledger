import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import config from '../config/index.js';

// Helper function to generate JWT
const generateToken = (id: string) => {
    return jwt.sign({ id }, config.jwtSecret!, { expiresIn: '30d' });
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400)
        throw new Error('Please provide all required fields: name, email, password.');
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
        res.status(400)
        throw new Error('User with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({ data: { name, email, password: hashedPassword } });

    if (user) {
        res.status(201).json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user.id) });
    } else {
        res.status(400)
        throw new Error('Invalid user data provided.');
    }
});

/**
 * @desc    Authenticate a user and get a token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user.id) });
    } else {
        res.status(401);
        throw new Error('Invalid email or password.');
    }
});

/**
 * @desc    Handle OAuth sign-in (e.g., from Google)
 * @route   POST /api/v1/auth/oauth
 * @access  Public
 */
export const handleOAuth = asyncHandler(async (req: Request, res: Response) => {
    const { email, name, provider, providerAccountId } = req.body;
    if (!email || !name || !provider || !providerAccountId) {
        res.status(400);
        throw new Error('Missing required OAuth fields.')
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Create a new user if they don't exist
        user = await prisma.user.create({
            data: {
                email,
                name,
                password: '', // No password for OAuth users
                accounts: {
                    create: {
                        type: 'oauth',
                        provider,
                        providerAccountId,
                    }
                }
            },
        });
    } else {
        // Link account if user exists but provider is new
        const accountExists = await prisma.account.findUnique({
            where: { provider_providerAccountId: { provider, providerAccountId } }
        });
        if (!accountExists) {
            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider,
                    providerAccountId,
                }
            });
        }
    }
    
    res.status(200).json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user.id) });
});


/**
 * @desc    Get current logged-in user's data
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: any, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
        res.status(404)
        throw new Error('User not found.')
    }
    res.status(200).json(user);
});
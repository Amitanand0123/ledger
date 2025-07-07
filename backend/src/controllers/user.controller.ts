import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';

/**
 * @desc    Update user profile (name)
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(
    async (req: any, res: Response) => {
        const { name } = req.body;
        const updatedUser = await UserService.updateUserProfile(
            req.user.id,
            name
        );
        res.status(200).json(updatedUser);
    }
);

/**
 * @desc    Change user password
 * @route   PUT /api/v1/users/password
 * @access  Private
 */
export const changeUserPassword = asyncHandler(
    async (req: any, res: Response) => {
        const { currentPassword, newPassword } = req.body;
        await UserService.changePassword(
            req.user.id,
            currentPassword,
            newPassword 
        );
        res.status(200).json({ message: 'Password updated successfully.' });
    }
);

/**
 * @desc    Get user application stats
 * @route   GET /api/v1/users/stats
 * @access  Private
 */
export const getUserStats = asyncHandler(async (req: any, res: Response) => {
    const stats = await UserService.getApplicationStats(req.user.id);
    res.status(200).json(stats);
});

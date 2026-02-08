import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export const updateUserProfile = asyncHandler(
    async (req: any, res: Response) => {
        const { name } = req.body;
        const updatedUser = await UserService.updateUserProfile(
            req.user.id,
            name
        );
        sendSuccess(res, 200, updatedUser);
    }
);

export const changeUserPassword = asyncHandler(
    async (req: any, res: Response) => {
        const { currentPassword, newPassword } = req.body;
        await UserService.changePassword(
            req.user.id,
            currentPassword,
            newPassword 
        );
        sendSuccess(res, 200, null, { message: 'Password updated successfully.' });
    }
);

export const getUserStats = asyncHandler(async (req: any, res: Response) => {
    const stats = await UserService.getApplicationStats(req.user.id);
    sendSuccess(res, 200, stats);
});

export const getAdvancedUserStats = asyncHandler(async (req: any, res: Response) => {
    const stats = await UserService.getAdvancedApplicationStats(req.user.id);
    sendSuccess(res, 200, stats);
});

export const completeOnboarding = asyncHandler(async (req: any, res: Response) => {
    const updatedUser = await UserService.completeOnboarding(req.user.id);
    sendSuccess(res, 200, updatedUser);
});


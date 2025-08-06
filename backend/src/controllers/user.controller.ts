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

/**
 * @desc    Get advanced user application stats
 * @route   GET /api/v1/users/stats/advanced
 * @access  Private
 */
export const getAdvancedUserStats = asyncHandler(async (req: any, res: Response) => {
    const stats = await UserService.getAdvancedApplicationStats(req.user.id);
    res.status(200).json(stats);
});

/**
 * @desc    Update user's Airtable settings
 * @route   PUT /api/v1/users/settings/airtable
 * @access  Private
 */
export const updateAirtableSettings = asyncHandler(async (req: any, res: Response) => {
    const { apiKey, baseId, tableName } = req.body;
    const user = await UserService.updateAirtableSettings(req.user.id, { apiKey, baseId, tableName });
    res.status(200).json({ message: "Airtable settings updated successfully." });
});

/**
 * @desc    Trigger a manual sync to Airtable
 * @route   POST /api/v1/users/settings/airtable/sync
 * @access  Private
 */
export const syncToAirtable = asyncHandler(async (req: any, res: Response) => {
    const result = await UserService.syncJobsToAirtable(req.user.id);
    res.status(200).json(result);
});

/**
 * @desc    Update user's webhook settings
 * @route   PUT /api/v1/users/settings/webhook
 * @access  Private
 */
export const updateWebhookSettings = asyncHandler(async (req: any, res: Response) => {
    const { eventType, targetUrl } = req.body;
    await UserService.updateWebhookSettings(req.user.id, eventType, targetUrl);
    res.status(200).json({ message: "Webhook settings updated." });
});
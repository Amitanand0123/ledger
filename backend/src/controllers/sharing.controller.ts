// backend/src/controllers/sharing.controller.ts

import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as SharingService from '../services/sharing.service.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const shareDashboard = asyncHandler(async (req: any, res: Response) => {
    const { email } = req.body;
    if (!email) {
        throw new ValidationError('Email address is required.');
    }
    const newShare = await SharingService.createShare(req.user.id, email);
    sendSuccess(res, 201, newShare);
});

export const getMySharedUsers = asyncHandler(async (req: any, res: Response) => {
    const shares = await SharingService.getOwnedShares(req.user.id);
    sendSuccess(res, 200, shares);
});

export const revokeShareAccess = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await SharingService.deleteShare(id, req.user.id);
    sendSuccess(res, 200, { id }, { message: 'Share access revoked successfully.' });
});
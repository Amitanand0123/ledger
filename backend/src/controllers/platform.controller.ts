import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as PlatformService from '../services/platform.service.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getPlatforms = asyncHandler(async (req: any, res: Response) => {
    const { search } = req.query;
    const platforms = await PlatformService.findPlatforms(search as string);
    sendSuccess(res, 200, platforms);
});

export const createPlatform = asyncHandler(async (req: any, res: Response) => {
    const { name } = req.body;
    if (!name) {
        throw new ValidationError('Platform name is required.');
    }
    const platform = await PlatformService.createPlatform(name);
    sendSuccess(res, 201, platform);
});
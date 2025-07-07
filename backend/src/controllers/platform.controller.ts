// backend/src/controllers/platform.controller.ts

import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as PlatformService from '../services/platform.service';

/**
 * @desc    Get or search for job platforms
 * @route   GET /api/v1/platforms
 * @access  Private
 */
export const getPlatforms = asyncHandler(async (req: any, res: Response) => {
    const { search } = req.query;
    const platforms = await PlatformService.findPlatforms(search as string);
    res.status(200).json(platforms);
});

/**
 * @desc    Create a new job platform
 * @route   POST /api/v1/platforms
 * @access  Private
 */
export const createPlatform = asyncHandler(async (req: any, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400);
        throw new Error('Platform name is required.');
    }
    // FIXED: The service expects a string, not an object.
    const platform = await PlatformService.createPlatform(name);
    res.status(201).json(platform);
});
// backend/src/controllers/gcal.controller.ts

import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as GCalService from '../services/gcal.service.js';
import { prisma } from '../config/db.js';
import * as JobService from '../services/job.service.js';
import config from '../config/index.js';

/**
 * @desc    Get the Google OAuth2 consent screen URL
 * @route   GET /api/v1/gcal/auth-url
 * @access  Private
 */
export const getGoogleAuthUrl = asyncHandler(
    async (req: any, res: Response) => {
        // We pass the user's ID in the 'state' parameter to identify them in the callback
        const state = req.user.id;
        const url = GCalService.getAuthUrl(state); // This now works because the service is updated
        res.status(200).json({ url });
    }
);

/**
 * @desc    Callback URL for Google OAuth2 flow
 * @route   GET /api/v1/gcal/oauth2callback
 * @access  Public (but requires state for user identification)
 */
export const oauth2Callback = asyncHandler(
    async (req: Request, res: Response) => {
        const { code, state } = req.query;
        const userId = state as string;

        if (!code || !userId) {
            throw new Error(
                'Missing authorization code or state from Google callback.'
            );
        }

        // FIXED: Renamed function call
        const tokens = await GCalService.getTokensFromCode(code as string);

        if (tokens.refresh_token) {
            // Securely store the refresh token against the user's record
            await prisma.user.update({
                where: { id: userId },
                data: { gcalRefreshToken: tokens.refresh_token },
            });
        }

        // Redirect user back to the settings page with a success indicator
        res.redirect(`${config.clientUrl}/settings?gcal_status=success`);
    }
);

/**
 * @desc    Schedule an interview in Google Calendar
 * @route   POST /api/v1/gcal/schedule
 * @access  Private
 */
export const scheduleInterview = asyncHandler(
    async (req: any, res: Response) => {
        const { jobId, start, end, summary, description } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        
        // FIXED: This service function is now implemented in job.service.ts
        const job = await JobService.getJobById(jobId, req.user.id);

        if (!user?.gcalRefreshToken) {
            res.status(403);
            throw new Error(
                'User has not connected their Google Calendar account.'
            );
        }
        if (!job) {
            res.status(404);
            throw new Error('Job application not found.');
        }

        const eventSummary = summary || `Interview: ${job.position} at ${job.company}`;
        const eventDescription = description || job.description || 'Interview for the specified role.';

        await GCalService.createCalendarEvent(
            user.gcalRefreshToken,
            eventSummary,
            eventDescription,
            start,
            end
        );

        // Also update the interview date in our own DB for tracking
        await JobService.updateJob(jobId, req.user.id, {
            interviewDate: new Date(start),
        });

        res.status(200).json({ message: 'Interview scheduled successfully.' });
    }
);
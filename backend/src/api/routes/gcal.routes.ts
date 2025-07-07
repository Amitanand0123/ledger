import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    getGoogleAuthUrl,
    oauth2Callback,
    scheduleInterview,
} from '../../controllers/gcal.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/gcal/auth-url
 * @desc    Get the URL to start the Google OAuth2 flow
 * @access  Private
 */
router.get('/auth-url', protect, getGoogleAuthUrl);

/**
 * @route   GET /api/v1/gcal/oauth2callback
 * @desc    The callback URL that Google redirects to after user consent
 * @access  Public (but contains a code that is then used in a secure context)
 */
router.get('/oauth2callback', oauth2Callback);

/**
 * @route   POST /api/v1/gcal/schedule
 * @desc    Create a calendar event for a specific job interview
 * @access  Private
 */
router.post('/schedule', protect, scheduleInterview);

export default router;

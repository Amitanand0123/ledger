import { Router } from 'express';
import {
    updateUserProfile,
    changeUserPassword,
    getUserStats,
    getAdvancedUserStats,
    updateAirtableSettings,
    syncToAirtable,
    updateWebhookSettings
} from '../../controllers/user.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All user management routes are protected.
router.use(protect);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get application statistics for the logged-in user
 * @access  Private
 */
router.get('/stats', getUserStats);
router.get('/stats/advanced', getAdvancedUserStats);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update the logged-in user's profile information (e.g., name)
 * @access  Private
 */
router.put('/profile', updateUserProfile);

router.put('/settings/airtable', updateAirtableSettings);
router.post('/settings/airtable/sync', syncToAirtable);

router.put('/settings/webhook', updateWebhookSettings);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change the logged-in user's password
 * @access  Private
 */
router.put('/password', changeUserPassword);

export default router;

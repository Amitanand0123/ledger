import { Router } from 'express';
import {
    updateUserProfile,
    changeUserPassword,
    getUserStats,
} from '../../controllers/user.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// All user management routes are protected.
router.use(protect);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get application statistics for the logged-in user
 * @access  Private
 */
router.get('/stats', getUserStats);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update the logged-in user's profile information (e.g., name)
 * @access  Private
 */
router.put('/profile', updateUserProfile);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change the logged-in user's password
 * @access  Private
 */
router.put('/password', changeUserPassword);

export default router;

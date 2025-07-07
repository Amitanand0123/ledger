import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    getPlatforms,
    createPlatform,
} from '../../controllers/platform.controller.js';

const router = Router();

// All platform routes are protected.
router.use(protect);

/**
 * @route   GET /api/v1/platforms
 * @desc    Get/search for job platforms
 * @access  Private
 */
/**
 * @route   POST /api/v1/platforms
 * @desc    Create a new job platform
 * @access  Private
 */
router.route('/').get(getPlatforms).post(createPlatform);

export default router;

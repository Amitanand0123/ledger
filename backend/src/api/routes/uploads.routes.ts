import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { generateUploadUrl } from '../../controllers/uploads.controller.js';

const router = Router();

// All upload-related routes are protected.
router.use(protect);

/**
 * @route   POST /api/v1/uploads/presigned-url
 * @desc    Generate a secure S3 presigned URL for file uploads
 * @access  Private
 */
router.post('/presigned-url', generateUploadUrl);

export default router;

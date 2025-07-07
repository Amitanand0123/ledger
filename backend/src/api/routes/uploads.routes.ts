import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { generateUploadUrl } from '../../controllers/uploads.controller';

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

import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { getJobAnalysis } from '../../controllers/ai.controller.js';

const router = Router();

// All AI routes require a user to be logged in.
router.use(protect);

/**
 * @route   GET /api/v1/ai/analyze/:jobId
 * @desc    Get an AI-powered analysis of a job description
 * @access  Private
 */
router.get('/analyze/:jobId', getJobAnalysis);

export default router;

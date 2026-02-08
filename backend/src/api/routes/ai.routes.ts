import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { getJobAnalysis } from '../../controllers/ai.controller.js';

const router = Router();

router.use(protect);

router.get('/analyze/:jobId', getJobAnalysis);

export default router;

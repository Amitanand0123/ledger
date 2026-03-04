import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { getJobAnalysis, extractJobFromUrl, scoreResume, rebuildResumeStandalone } from '../../controllers/ai.controller.js';

const router = Router();

router.use(protect);

router.get('/analyze/:jobId', getJobAnalysis);
router.post('/extract-job-url', extractJobFromUrl);
router.post('/score-resume', scoreResume);
router.post('/rebuild-resume', rebuildResumeStandalone);

export default router;

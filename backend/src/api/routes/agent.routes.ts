import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { invokeAiAgent, rebuildResume } from '../../controllers/agent.controller.js';

const router = Router();
router.use(protect);

router.post('/invoke', invokeAiAgent);
router.post('/rebuild-resume', rebuildResume);

export default router;
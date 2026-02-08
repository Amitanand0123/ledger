import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { generateUploadUrl } from '../../controllers/uploads.controller.js';

const router = Router();

router.use(protect);

router.post('/presigned-url', generateUploadUrl);

export default router;

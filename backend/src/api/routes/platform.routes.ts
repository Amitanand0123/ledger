import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    getPlatforms,
    createPlatform,
} from '../../controllers/platform.controller.js';

const router = Router();

router.use(protect);

router.route('/').get(getPlatforms).post(createPlatform);

export default router;

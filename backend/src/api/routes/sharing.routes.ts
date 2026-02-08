// backend/src/api/routes/sharing.routes.ts

import { protect } from '../../middleware/auth.middleware.js'; // Corrected path
import { Router } from 'express';
import { shareDashboard, getMySharedUsers, revokeShareAccess } from '../../controllers/sharing.controller.js'; // Corrected path

const router = Router();
router.use(protect);

router.route('/')
    .post(shareDashboard)
    .get(getMySharedUsers);

router.route('/:id')
    .delete(revokeShareAccess);

export default router;
import { Router } from 'express';
import {
    updateUserProfile,
    changeUserPassword,
    getUserStats,
    getAdvancedUserStats,
    completeOnboarding,
} from '../../controllers/user.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    updateProfileSchema,
    changePasswordSchema,
    completeOnboardingSchema,
} from '../../validation/user.schemas.js';

const router = Router();

router.use(protect);

router.get('/stats', getUserStats);
router.get('/stats/advanced', getAdvancedUserStats);

router.put('/profile', validate(updateProfileSchema), updateUserProfile);

router.put('/password', validate(changePasswordSchema), changeUserPassword);

router.post('/onboarding/complete', validate(completeOnboardingSchema), completeOnboarding);

export default router;

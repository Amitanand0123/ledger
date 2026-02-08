import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    handleOAuth,
    refreshAccessToken,
} from '../../controllers/auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, oAuthSchema } from '../../validation/auth.schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/oauth', validate(oAuthSchema), handleOAuth);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);

export default router;
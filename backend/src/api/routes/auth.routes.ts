import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    handleOAuth,
} from '../../controllers/auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/oauth', handleOAuth); // New route for Google Sign-In
router.get('/me', protect, getMe);

export default router;
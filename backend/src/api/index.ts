import { Router } from 'express';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import customFieldsRoutes from './routes/custom-fields.routes.js';
import gcalRoutes from './routes/gcal.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import platformRoutes from './routes/platform.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import userRoutes from './routes/user.routes.js';
import documentRoutes from  './routes/document.routes.js'
import agentRoutes from './routes/agent.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/platforms', platformRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/ai', aiRoutes);
router.use('/gcal', gcalRoutes);
router.use('/documents', documentRoutes); // New route
router.use('/agent', agentRoutes);

export default router;
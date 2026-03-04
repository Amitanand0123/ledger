import { Router } from 'express';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import customFieldsRoutes from './routes/custom-fields.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import platformRoutes from './routes/platform.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import userRoutes from './routes/user.routes.js';
import documentRoutes from  './routes/document.routes.js';
import agentRoutes from './routes/agent.routes.js';
import sharingRoutes from './routes/sharing.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import noteRoutes from './routes/note.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/platforms', platformRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/ai', aiRoutes);
router.use('/documents', documentRoutes);
router.use('/agent', agentRoutes);
router.use('/shares', sharingRoutes);
router.use('/interviews', interviewRoutes);
router.use('/notes', noteRoutes);

export default router;
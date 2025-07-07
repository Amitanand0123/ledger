import { Router } from 'express';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import customFieldsRoutes from './routes/custom-fields.routes';
import gcalRoutes from './routes/gcal.routes';
import jobsRoutes from './routes/jobs.routes';
import platformRoutes from './routes/platform.routes';
import uploadsRoutes from './routes/uploads.routes';
import userRoutes from './routes/user.routes';
import documentRoutes from  './routes/document.routes'

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

export default router;
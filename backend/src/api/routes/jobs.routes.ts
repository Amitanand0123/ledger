import { Router } from 'express';
import {
    createJobApplication,
    getJobApplications,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication,
    deleteBulkJobs,
} from '../../controllers/jobs.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.route('/')
    .get(getJobApplications)
    .post(createJobApplication)
    .delete(deleteBulkJobs); // Route for bulk deletion

router.route('/:id')
    .get(getJobApplicationById)
    .put(updateJobApplication)
    .delete(deleteJobApplication);

export default router;
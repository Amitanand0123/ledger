import { Router } from 'express';
import {
    createJobApplication,
    getJobApplications,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication,
    deleteBulkJobs,
    analyzeJobMatch,
} from '../../controllers/jobs.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    createJobSchema,
    updateJobSchema,
    getJobSchema,
    deleteJobSchema,
} from '../../validation/job.schemas.js';

const router = Router();
router.use(protect);

router.route('/')
    .get(getJobApplications)
    .post(validate(createJobSchema), createJobApplication)
    .delete(deleteBulkJobs);

router.route('/:id')
    .get(validate(getJobSchema), getJobApplicationById)
    .put(validate(updateJobSchema), updateJobApplication)
    .delete(validate(deleteJobSchema), deleteJobApplication);

router.post('/:id/match-analysis', analyzeJobMatch);

export default router;
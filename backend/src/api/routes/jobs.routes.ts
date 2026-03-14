import { Router } from 'express';
import {
    createJobApplication,
    getJobApplications,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication,
    deleteBulkJobs,
    analyzeJobMatch,
    getStatusCounts,
    bulkUpdateStatus,
    rescoreJob,
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

// Static routes MUST come before /:id routes
router.get('/status-counts', getStatusCounts);
router.patch('/bulk-status', bulkUpdateStatus);

router.route('/')
    .get(getJobApplications)
    .post(validate(createJobSchema), createJobApplication)
    .delete(deleteBulkJobs);

router.route('/:id')
    .get(validate(getJobSchema), getJobApplicationById)
    .put(validate(updateJobSchema), updateJobApplication)
    .delete(validate(deleteJobSchema), deleteJobApplication);

router.post('/:id/match-analysis', analyzeJobMatch);
router.post('/:id/rescore', rescoreJob);

export default router;

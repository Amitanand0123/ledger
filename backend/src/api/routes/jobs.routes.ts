import { Router } from 'express';
import {
    createJobApplication,
    getJobApplications,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication,
    deleteBulkJobs,
    analyzeJobMatch,
    findSimilarJobs
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

router.post('/:id/match-analysis', analyzeJobMatch); 
router.route('/:id/similar').get(findSimilarJobs);

export default router;
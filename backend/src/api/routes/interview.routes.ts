import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    createInterview,
    getInterviewsForJob,
    getUpcomingInterviews,
    getAllInterviews,
    updateInterview,
    deleteInterview,
} from '../../controllers/interview.controller.js';
import {
    createInterviewSchema,
    updateInterviewSchema,
    deleteInterviewSchema,
    getInterviewsByJobSchema,
    getUpcomingInterviewsSchema,
} from '../../validation/interview.schemas.js';

const router = Router();

router.use(protect);

router.route('/')
    .post(validate(createInterviewSchema), createInterview)
    .get(getAllInterviews);

router.get('/upcoming', validate(getUpcomingInterviewsSchema), getUpcomingInterviews);
router.get('/job/:jobId', validate(getInterviewsByJobSchema), getInterviewsForJob);

router.route('/:id')
    .put(validate(updateInterviewSchema), updateInterview)
    .delete(validate(deleteInterviewSchema), deleteInterview);

export default router;

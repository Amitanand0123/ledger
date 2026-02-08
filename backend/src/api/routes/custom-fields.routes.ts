import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    getCustomFields,
    createCustomField,
    deleteCustomField,
} from '../../controllers/custom-fields.controller.js';

const router = Router();

router.use(protect);
router.route('/').get(getCustomFields).post(createCustomField);
router.route('/:id').delete(deleteCustomField);

export default router;

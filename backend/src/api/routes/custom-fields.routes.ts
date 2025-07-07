import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import {
    getCustomFields,
    createCustomField,
    deleteCustomField,
} from '../../controllers/custom-fields.controller';

const router = Router();

// All custom field routes are protected.
router.use(protect);

/**
 * @route   GET /api/v1/custom-fields
 * @desc    Get all custom fields for the logged-in user
 * @access  Private
 */
/**
 * @route   POST /api/v1/custom-fields
 * @desc    Create a new custom field
 * @access  Private
 */
router.route('/').get(getCustomFields).post(createCustomField);

/**
 * @route   DELETE /api/v1/custom-fields/:id
 * @desc    Delete a custom field by its ID
 * @access  Private
 */
router.route('/:id').delete(deleteCustomField);

export default router;

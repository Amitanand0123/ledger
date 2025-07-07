import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { createDocument, getDocuments, deleteDocument } from '../../controllers/document.controller.js';

const router = Router();

router.use(protect);

router.route('/')
    .post(createDocument)
    .get(getDocuments);

router.route('/:id')
    .delete(deleteDocument);

export default router;
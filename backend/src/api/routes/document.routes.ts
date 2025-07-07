import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createDocument, getDocuments, deleteDocument } from '../../controllers/document.controller';

const router = Router();

router.use(protect);

router.route('/')
    .post(createDocument)
    .get(getDocuments);

router.route('/:id')
    .delete(deleteDocument);

export default router;
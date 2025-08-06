import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { createDocument, getDocuments, deleteDocument, getDocumentDownloadUrl } from '../../controllers/document.controller.js';


const router = Router();

router.use(protect);

router.route('/')
    .post(createDocument)
    .get(getDocuments);

router.get('/:id/download-url', getDocumentDownloadUrl);

router.route('/:id')
    .delete(deleteDocument);

export default router;
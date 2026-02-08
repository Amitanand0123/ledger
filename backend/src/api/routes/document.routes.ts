import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createDocument, getDocuments, deleteDocument, getDocumentDownloadUrl } from '../../controllers/document.controller.js';
import {
    createDocumentSchema,
    deleteDocumentSchema,
    getDocumentDownloadUrlSchema
} from '../../validation/document.schemas.js';

const router = Router();

router.use(protect);

router.route('/')
    .post(validate(createDocumentSchema), createDocument)
    .get(getDocuments);

router.get('/:id/download-url', validate(getDocumentDownloadUrlSchema), getDocumentDownloadUrl);

router.route('/:id')
    .delete(validate(deleteDocumentSchema), deleteDocument);

export default router;
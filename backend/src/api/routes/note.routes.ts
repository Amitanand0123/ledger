import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    createNote,
    getNotesForJob,
    getAllNotes,
    updateNote,
    deleteNote,
} from '../../controllers/note.controller.js';
import {
    createNoteSchema,
    updateNoteSchema,
    deleteNoteSchema,
    getNotesByJobSchema,
} from '../../validation/note.schemas.js';

const router = Router();

router.use(protect);

router.route('/')
    .post(validate(createNoteSchema), createNote)
    .get(getAllNotes);

router.get('/job/:jobId', validate(getNotesByJobSchema), getNotesForJob);

router.route('/:id')
    .put(validate(updateNoteSchema), updateNote)
    .delete(validate(deleteNoteSchema), deleteNote);

export default router;

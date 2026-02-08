import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as NoteService from '../services/note.service.js';
import { ValidationError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const createNote = asyncHandler(async (req: any, res: Response) => {
    const { jobId, content, isPinned } = req.body;

    if (!jobId || !content) {
        throw new ValidationError('Job ID and content are required.');
    }

    const note = await NoteService.createNote(jobId, req.user.id, content, isPinned);
    sendSuccess(res, 201, note);
});

export const getNotesForJob = asyncHandler(async (req: any, res: Response) => {
    const { jobId } = req.params;

    if (!jobId) {
        throw new ValidationError('Job ID is required.');
    }

    const notes = await NoteService.getNotesForJob(jobId, req.user.id);
    sendSuccess(res, 200, notes);
});

export const getAllNotes = asyncHandler(async (req: any, res: Response) => {
    const notes = await NoteService.getAllNotes(req.user.id);
    sendSuccess(res, 200, notes);
});

export const updateNote = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { content, isPinned } = req.body;

    if (!id) {
        throw new ValidationError('Note ID is required.');
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const note = await NoteService.updateNote(id, req.user.id, updateData);
    sendSuccess(res, 200, note);
});

export const deleteNote = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ValidationError('Note ID is required.');
    }

    await NoteService.deleteNote(id, req.user.id);
    sendSuccess(res, 200, { id }, { message: 'Note deleted successfully.' });
});

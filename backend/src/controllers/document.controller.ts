import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as DocumentService from '../services/document.service.js';
import { docTypeEnum, documents } from '../db/schema/index.js';
import { db } from '../db/client.js';
import { eq, and } from 'drizzle-orm';
import * as S3Service from '../services/s3.service.js';
import { ValidationError, NotFoundError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const VALID_DOC_TYPES = docTypeEnum.enumValues;

export const createDocument = asyncHandler(async (req: any, res: Response) => {
    const { filename, fileKey, type, latexSource } = req.body;
    if (!filename || !fileKey || !type) {
        throw new ValidationError('Filename, fileKey, and type are required.');
    }
    if (!VALID_DOC_TYPES.includes(type)) {
        throw new ValidationError('Invalid document type.');
    }
    // Validate that the fileKey belongs to the current user to prevent S3 key injection
    if (!fileKey.startsWith(`uploads/${req.user.id}/`)) {
        throw new ValidationError('Invalid file key.');
    }
    const doc = await DocumentService.createDocumentRecord(req.user.id, filename, fileKey, type, latexSource);
    sendSuccess(res, 201, doc);
});

export const getDocuments = asyncHandler(async (req: any, res: Response) => {
    const { type } = req.query;
    const docType = type ? (type as string).toUpperCase() : undefined;
    if (docType && !VALID_DOC_TYPES.includes(docType as any)) {
        throw new ValidationError('Invalid document type query.');
    }
    const docs = await DocumentService.getDocumentsForUser(req.user.id, docType as any);
    sendSuccess(res, 200, docs);
});

export const deleteDocument = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await DocumentService.deleteDocumentRecord(id, req.user.id);
    sendSuccess(res, 200, { id }, { message: 'Document deleted successfully.' });
});

export const getDocumentDownloadUrl = asyncHandler(async (req: any, res: Response) => {
    const { id: docId } = req.params;
    const [document] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, docId), eq(documents.userId, req.user.id)))
        .limit(1);

    if (!document) {
        throw new NotFoundError('Document');
    }
    const downloadUrl = await S3Service.getDownloadPresignedUrl(document.fileKey);

    sendSuccess(res, 200, { url: downloadUrl });
});

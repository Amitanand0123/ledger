import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import * as DocumentService from '../services/document.service.js';
import { DocType } from '@prisma/client';
import { prisma } from '../config/db.js';
import * as S3Service from '../services/s3.service.js';

/**
 * @desc    Create a new document record
 * @route   POST /api/v1/documents
 * @access  Private
 */
export const createDocument = asyncHandler(async (req: any, res: Response) => {
    const { filename, fileKey, type, latexSource } = req.body;
    if (!filename || !fileKey || !type) {
        res.status(400);
        throw new Error('Filename, fileKey, and type are required.');
    }
    if (!Object.values(DocType).includes(type)) {
        res.status(400);
        throw new Error('Invalid document type.');
    }
    const doc = await DocumentService.createDocumentRecord(req.user.id, filename, fileKey, type, latexSource);
    res.status(201).json(doc);
});

/**
 * @desc    Get all of a user's documents, optionally filtered by type
 * @route   GET /api/v1/documents
 * @access  Private
 */
export const getDocuments = asyncHandler(async (req: any, res: Response) => {
    const { type } = req.query;
    const docType = type ? (type as string).toUpperCase() as DocType : undefined;
    if (docType && !Object.values(DocType).includes(docType)) {
        res.status(400).send({ message: 'Invalid document type query' });
        return;
    }
    const docs = await DocumentService.getDocumentsForUser(req.user.id, docType);
    res.status(200).json(docs);
});

/**
 * @desc    Delete a document
 * @route   DELETE /api/v1/documents/:id
 * @access  Private
 */
export const deleteDocument = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    await DocumentService.deleteDocumentRecord(id, req.user.id);
    res.status(200).json({ id, message: 'Document deleted successfully.' });
});

/**
 * @desc    Get a secure, pre-signed URL to download a document
 * @route   GET /api/v1/documents/:id/download-url
 * @access  Private
 */
export const getDocumentDownloadUrl = asyncHandler(async (req: any, res: Response) => {
    const { id: docId } = req.params;

    // 1. Verify the user owns this document
    const document = await prisma.document.findFirst({
        where: { id: docId, userId: req.user.id },
    });

    if (!document) {
        res.status(404);
        throw new Error('Document not found or you do not have permission to access it.');
    }

    // 2. Generate the pre-signed URL
    const downloadUrl = await S3Service.getDownloadPresignedUrl(document.fileKey);

    res.status(200).json({ url: downloadUrl });
});
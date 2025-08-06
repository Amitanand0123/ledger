import { prisma } from '../config/db.js';
import { DocType } from '@prisma/client';
import { deleteObjectFromS3 } from './s3.service.js'; // Import the S3 delete function

export const createDocumentRecord = (userId: string, filename: string, fileKey: string, type: DocType, latexSource?: string) => {
    return prisma.document.create({
        data: { userId, filename, fileKey, type, latexSource },
    });
};

export const getDocumentsForUser = (userId: string, type?: DocType) => {
    return prisma.document.findMany({
        where: { userId, ...(type && { type }) },
        orderBy: { createdAt: 'desc' },
    });
};

export const deleteDocumentRecord = async (docId: string, userId: string) => {
    const document = await prisma.document.findFirst({
        where: { id: docId, userId },
    });

    if (!document) {
        throw new Error('Document not found or user not authorized.');
    }

    // 1. Delete the file from S3 bucket first.
    await deleteObjectFromS3(document.fileKey);

    // 2. Then, delete the record from the database.
    return prisma.document.delete({
        where: { id: docId },
    });
};
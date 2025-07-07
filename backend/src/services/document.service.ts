import { prisma } from '../config/db';
import { DocType } from '@prisma/client';

export const createDocumentRecord = (userId: string, filename: string, fileKey: string, type: DocType) => {
    return prisma.document.create({
        data: {
            userId,
            filename,
            fileKey,
            type,
        },
    });
};

export const getDocumentsForUser = (userId: string, type?: DocType) => {
    return prisma.document.findMany({
        where: {
            userId,
            ...(type && { type }),
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

export const deleteDocumentRecord = async (docId: string, userId: string) => {
    const document = await prisma.document.findFirst({
        where: { id: docId, userId },
    });

    if (!document) {
        throw new Error('Document not found or user not authorized.');
    }

    // TODO: In a real app, also delete the file from S3 here.
    // For now, we just delete the DB record.

    return prisma.document.delete({
        where: { id: docId },
    });
};
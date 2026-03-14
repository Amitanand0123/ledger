import { db } from '../db/client.js';
import { documents, docTypeEnum } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { deleteObjectFromS3 } from './s3.service.js';

// Type inference from enum
type DocType = typeof docTypeEnum.enumValues[number];

export const createDocumentRecord = async (
    userId: string,
    filename: string,
    fileKey: string,
    type: DocType,
    latexSource?: string
) => {
    const [document] = await db
        .insert(documents)
        .values({ userId, filename, fileKey, type, latexSource })
        .returning();

    return document;
};

export const getDocumentsForUser = async (userId: string, type?: DocType, page = 1, limit = 50) => {
    if (type) {
        return db
            .select()
            .from(documents)
            .where(and(eq(documents.userId, userId), eq(documents.type, type)))
            .orderBy(desc(documents.createdAt))
            .limit(limit)
            .offset((page - 1) * limit);
    }

    return db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
};

export const deleteDocumentRecord = async (docId: string, userId: string) => {
    const [document] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
        .limit(1);

    if (!document) {
        throw new Error('Document not found or user not authorized.');
    }

    await deleteObjectFromS3(document.fileKey);

    const [deletedDocument] = await db
        .delete(documents)
        .where(eq(documents.id, docId))
        .returning();

    return deletedDocument;
};

import { prisma } from '../config/db';
import { FieldType } from '@prisma/client';

export const getFieldsForUser = (userId: string) => {
    return prisma.customField.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
    });
};

export const createField = (userId: string, name: string, type: FieldType) => {
    return prisma.customField.create({
        data: {
            name,
            type,
            userId,
        },
    });
};

export const deleteField = async (fieldId: string, userId: string) => {
    // First, ensure the user owns this field to prevent unauthorized deletion.
    const field = await prisma.customField.findFirst({
        where: { id: fieldId, userId },
    });

    if (!field) {
        throw new Error('Custom field not found or user not authorized.');
    }

    // Prisma's cascading delete will handle removing associated CustomFieldValue entries.
    return prisma.customField.delete({
        where: { id: fieldId },
    });
};

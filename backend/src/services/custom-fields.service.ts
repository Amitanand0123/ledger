import { db } from '../db/client.js';
import { customFields, fieldTypeEnum } from '../db/schema/index.js';
import { eq, and, asc } from 'drizzle-orm';

// Type inference from enum
type FieldType = typeof fieldTypeEnum.enumValues[number];

export const getFieldsForUser = async (userId: string) => {
    return db
        .select()
        .from(customFields)
        .where(eq(customFields.userId, userId))
        .orderBy(asc(customFields.name));
};

export const createField = async (userId: string, name: string, type: FieldType) => {
    const [field] = await db
        .insert(customFields)
        .values({
            name,
            type,
            userId,
        })
        .returning();

    return field;
};

export const deleteField = async (fieldId: string, userId: string) => {
    const [field] = await db
        .select()
        .from(customFields)
        .where(and(eq(customFields.id, fieldId), eq(customFields.userId, userId)))
        .limit(1);

    if (!field) {
        throw new Error('Custom field not found or user not authorized.');
    }

    const [deletedField] = await db
        .delete(customFields)
        .where(eq(customFields.id, fieldId))
        .returning();

    return deletedField;
};

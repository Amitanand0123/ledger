import { db } from '../db/client.js';
import { notes, jobApplications } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export const createNote = async (
    jobId: string,
    userId: string,
    content: string,
    isPinned: boolean = false
) => {
    // Verify job belongs to user
    const [job] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!job) {
        throw new Error('Job application not found or you do not have permission.');
    }

    const [note] = await db
        .insert(notes)
        .values({
            content,
            jobId,
            userId,
            isPinned,
        })
        .returning();

    return note;
};

export const getNotesForJob = async (jobId: string, userId: string) => {
    // Verify job belongs to user
    const [job] = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)))
        .limit(1);

    if (!job) {
        throw new Error('Job application not found or you do not have permission.');
    }

    return db
        .select()
        .from(notes)
        .where(eq(notes.jobId, jobId))
        .orderBy(desc(notes.isPinned), desc(notes.createdAt));
};

export const getAllNotes = async (userId: string) => {
    return db.query.notes.findMany({
        where: eq(notes.userId, userId),
        with: {
            job: {
                columns: {
                    id: true,
                    company: true,
                    position: true,
                },
            },
        },
        orderBy: [desc(notes.isPinned), desc(notes.createdAt)],
    });
};

export const updateNote = async (
    noteId: string,
    userId: string,
    data: {
        content?: string;
        isPinned?: boolean;
    }
) => {
    // Verify note belongs to user
    const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

    if (!note) {
        throw new Error('Note not found or you do not have permission.');
    }

    const [updatedNote] = await db
        .update(notes)
        .set(data)
        .where(eq(notes.id, noteId))
        .returning();

    return updatedNote;
};

export const deleteNote = async (noteId: string, userId: string) => {
    // Verify note belongs to user
    const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

    if (!note) {
        throw new Error('Note not found or you do not have permission.');
    }

    const [deletedNote] = await db
        .delete(notes)
        .where(eq(notes.id, noteId))
        .returning();

    return deletedNote;
};

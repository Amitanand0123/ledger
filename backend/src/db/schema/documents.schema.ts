import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { docTypeEnum } from './enums';
import { users } from './users.schema';
import { jobApplications } from './jobs.schema';

// Document table
export const documents = pgTable('Document', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  filename: text('filename').notNull(),
  fileKey: text('fileKey').notNull().unique(), // S3 Key
  type: docTypeEnum('type').notNull(),
  latexSource: text('latexSource'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('Document_userId_idx').on(table.userId),
}));

// Relations for Document
export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  resumes: many(jobApplications, { relationName: 'resume' }),
  coverLetters: many(jobApplications, { relationName: 'coverLetter' }),
}));

import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users.schema';
import { jobApplications } from './jobs.schema';

// Note table
export const notes = pgTable('Note', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  content: text('content').notNull(),
  jobId: text('jobId').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPinned: boolean('isPinned').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  jobIdIdx: index('Note_jobId_idx').on(table.jobId),
  userIdIdx: index('Note_userId_idx').on(table.userId),
}));

// Relations for Note
export const notesRelations = relations(notes, ({ one }) => ({
  job: one(jobApplications, {
    fields: [notes.jobId],
    references: [jobApplications.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

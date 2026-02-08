import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { interviewTypeEnum } from './enums';
import { jobApplications } from './jobs.schema';

// Interview table
export const interviews = pgTable('Interview', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  jobId: text('jobId').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  type: interviewTypeEnum('type').default('PHONE_SCREEN').notNull(),
  scheduledAt: timestamp('scheduledAt', { mode: 'date' }).notNull(),
  duration: integer('duration'), // Duration in minutes
  location: text('location'), // Physical address or video call link
  notes: text('notes'),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  jobIdIdx: index('Interview_jobId_idx').on(table.jobId),
  scheduledAtIdx: index('Interview_scheduledAt_idx').on(table.scheduledAt),
}));

// Relations for Interview
export const interviewsRelations = relations(interviews, ({ one }) => ({
  job: one(jobApplications, {
    fields: [interviews.jobId],
    references: [jobApplications.id],
  }),
}));

import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { jobStatusEnum } from './enums';
import { users } from './users.schema';

// JobPlatform table
export const jobPlatforms = pgTable('JobPlatform', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
});

// JobApplication table
export const jobApplications = pgTable('JobApplication', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  company: text('company').notNull(),
  position: text('position').notNull(),
  location: text('location').notNull(),
  salary: text('salary'),
  salaryMin: integer('salaryMin'),
  salaryMax: integer('salaryMax'),
  url: text('url'),
  description: text('description'),
  summary: text('summary'),
  applicationDate: timestamp('applicationDate', { mode: 'date' }).defaultNow().notNull(),
  deadline: timestamp('deadline', { mode: 'date' }),
  status: jobStatusEnum('status').default('INTERESTED').notNull(),
  order: integer('order').default(0).notNull(),
  aiAnalysisCount: integer('aiAnalysisCount').default(0).notNull(),
  aiScore: integer('aiScore'),
  aiFitAssessment: text('aiFitAssessment'),
  aiTailoredSummary: text('aiTailoredSummary'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: text('platformId').references(() => jobPlatforms.id, { onDelete: 'set null' }),
  resumeId: text('resumeId'), // Will be set with foreign key later (circular dependency)
  coverLetterId: text('coverLetterId'), // Will be set with foreign key later (circular dependency)
  interviewDate: timestamp('interviewDate', { mode: 'date' }),
  offerAmount: text('offerAmount'),
  offerDeadline: timestamp('offerDeadline', { mode: 'date' }),
  offerStartDate: timestamp('offerStartDate', { mode: 'date' }),
  offerNotes: text('offerNotes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('JobApplication_userId_idx').on(table.userId),
  statusIdx: index('JobApplication_status_idx').on(table.status),
  userIdStatusIdx: index('JobApplication_userId_status_idx').on(table.userId, table.status),
  deadlineIdx: index('JobApplication_deadline_idx').on(table.deadline),
  applicationDateIdx: index('JobApplication_applicationDate_idx').on(table.applicationDate),
  platformIdIdx: index('JobApplication_platformId_idx').on(table.platformId),
}));

// StatusHistory table
export const statusHistory = pgTable('StatusHistory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  jobId: text('jobId').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  status: jobStatusEnum('status').notNull(),
  changedAt: timestamp('changedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index('StatusHistory_jobId_idx').on(table.jobId),
  changedAtIdx: index('StatusHistory_changedAt_idx').on(table.changedAt),
  jobIdChangedAtIdx: index('StatusHistory_jobId_changedAt_idx').on(table.jobId, table.changedAt),
}));

// Relations for JobPlatform
export const jobPlatformsRelations = relations(jobPlatforms, ({ many }) => ({
  jobs: many(jobApplications),
}));

// Import other tables for relations (after table definitions to avoid circular dependencies)
// These imports are hoisted but the table definitions above are available
import { documents } from './documents.schema';
import { interviews } from './interviews.schema';
import { notes } from './notes.schema';
import { customFieldValues } from './custom-fields.schema';

// Relations for JobApplication
export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [jobApplications.userId],
    references: [users.id],
  }),
  platform: one(jobPlatforms, {
    fields: [jobApplications.platformId],
    references: [jobPlatforms.id],
  }),
  // Document relations
  resume: one(documents, {
    fields: [jobApplications.resumeId],
    references: [documents.id],
    relationName: 'resume',
  }),
  coverLetter: one(documents, {
    fields: [jobApplications.coverLetterId],
    references: [documents.id],
    relationName: 'coverLetter',
  }),
  statusHistory: many(statusHistory),
  customFieldValues: many(customFieldValues),
  interviews: many(interviews),
  notes: many(notes),
}));

// Relations for StatusHistory
export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  job: one(jobApplications, {
    fields: [statusHistory.jobId],
    references: [jobApplications.id],
  }),
}));

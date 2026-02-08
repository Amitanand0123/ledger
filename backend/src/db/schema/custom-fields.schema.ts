import { pgTable, text, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { fieldTypeEnum } from './enums';
import { users } from './users.schema';
import { jobApplications } from './jobs.schema';

// CustomField table
export const customFields = pgTable('CustomField', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  type: fieldTypeEnum('type').notNull(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  userIdNameUnique: unique('CustomField_userId_name_key').on(table.userId, table.name),
}));

// CustomFieldValue table
export const customFieldValues = pgTable('CustomFieldValue', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  value: text('value').notNull(),
  jobId: text('jobId').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  customFieldId: text('customFieldId').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
}, (table) => ({
  jobIdCustomFieldIdUnique: unique('CustomFieldValue_jobId_customFieldId_key').on(table.jobId, table.customFieldId),
}));

// Relations for CustomField
export const customFieldsRelations = relations(customFields, ({ one, many }) => ({
  user: one(users, {
    fields: [customFields.userId],
    references: [users.id],
  }),
  values: many(customFieldValues),
}));

// Relations for CustomFieldValue
export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  job: one(jobApplications, {
    fields: [customFieldValues.jobId],
    references: [jobApplications.id],
  }),
  customField: one(customFields, {
    fields: [customFieldValues.customFieldId],
    references: [customFields.id],
  }),
}));

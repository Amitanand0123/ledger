import { pgTable, text, boolean, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// User table
export const users = pgTable('User', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  onboardingCompleted: boolean('onboardingCompleted').default(false).notNull(),
  emailReminders: boolean('emailReminders').default(true).notNull(),
  reminderDaysBefore: integer('reminderDaysBefore').default(1).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Account table (OAuth accounts)
export const accounts = pgTable('Account', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  providerAccountUnique: unique('Account_provider_providerAccountId_key').on(table.provider, table.providerAccountId),
}));

// RefreshToken table
export const refreshTokens = pgTable('RefreshToken', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  token: text('token').notNull().unique(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('RefreshToken_userId_idx').on(table.userId),
  expiresAtIdx: index('RefreshToken_expiresAt_idx').on(table.expiresAt),
}));

// Import other tables for relations (after table definitions to avoid circular dependencies)
import { jobApplications } from './jobs.schema';
import { customFields } from './custom-fields.schema';
import { documents } from './documents.schema';
import { notes } from './notes.schema';
import { dashboardShares } from './sharing.schema';

// Relations for User
export const usersRelations = relations(users, ({ many }) => ({
  jobApplications: many(jobApplications),
  customFields: many(customFields),
  accounts: many(accounts),
  documents: many(documents),
  notes: many(notes),
  ownedShares: many(dashboardShares, { relationName: 'OwnedShares' }),
  viewableShares: many(dashboardShares, { relationName: 'ViewableShares' }),
  refreshTokens: many(refreshTokens),
}));

// Relations for Account
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Relations for RefreshToken
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

import { pgTable, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users.schema';

// DashboardShare table
export const dashboardShares = pgTable('DashboardShare', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ownerId: text('ownerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inviteEmail: text('inviteEmail').notNull(),
  viewerId: text('viewerId').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  ownerIdInviteEmailUnique: unique('DashboardShare_ownerId_inviteEmail_key').on(table.ownerId, table.inviteEmail),
  ownerIdIdx: index('DashboardShare_ownerId_idx').on(table.ownerId),
  viewerIdIdx: index('DashboardShare_viewerId_idx').on(table.viewerId),
}));

// Relations for DashboardShare
export const dashboardSharesRelations = relations(dashboardShares, ({ one }) => ({
  owner: one(users, {
    fields: [dashboardShares.ownerId],
    references: [users.id],
    relationName: 'OwnedShares',
  }),
  viewer: one(users, {
    fields: [dashboardShares.viewerId],
    references: [users.id],
    relationName: 'ViewableShares',
  }),
}));

import { pgTable, varchar, timestamp, text, integer, uniqueIndex, foreignKey, index, jsonb, primaryKey, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const docType = pgEnum('DocType', ['RESUME', 'COVER_LETTER']);
export const fieldType = pgEnum('FieldType', ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']);
export const teamRole = pgEnum('TeamRole', ['OWNER', 'EDITOR', 'VIEWER']);


export const prismaMigrations = pgTable('_prisma_migrations', {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
	migrationName: varchar('migration_name', { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp('rolled_back_at', { withTimezone: true, mode: 'string' }),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
});

export const team = pgTable('Team', {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
});

export const user = pgTable('User', {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	password: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	gcalRefreshToken: text(),
	airtableApiKey: text(),
	airtableBaseId: text(),
	airtableTableName: text().default('Job Applications'),
}, (table) => [
	uniqueIndex('User_email_key').using('btree', table.email.asc().nullsLast().op('text_ops')),
]);

export const jobPlatform = pgTable('JobPlatform', {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	uniqueIndex('JobPlatform_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
]);

export const customField = pgTable('CustomField', {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	type: fieldType().notNull(),
	userId: text().notNull(),
}, (table) => [
	uniqueIndex('CustomField_userId_name_key').using('btree', table.userId.asc().nullsLast().op('text_ops'), table.name.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'CustomField_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const customFieldValue = pgTable('CustomFieldValue', {
	id: text().primaryKey().notNull(),
	value: text().notNull(),
	customFieldId: text().notNull(),
	jobId: text().notNull(),
}, (table) => [
	uniqueIndex('CustomFieldValue_jobId_customFieldId_key').using('btree', table.jobId.asc().nullsLast().op('text_ops'), table.customFieldId.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.customFieldId],
			foreignColumns: [customField.id],
			name: 'CustomFieldValue_customFieldId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobApplication.id],
			name: 'CustomFieldValue_jobId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const jobApplication = pgTable('JobApplication', {
	id: text().primaryKey().notNull(),
	company: text().notNull(),
	position: text().notNull(),
	location: text().notNull(),
	description: text(),
	url: text(),
	salary: text(),
	salaryMin: integer(),
	salaryMax: integer(),
	order: integer().default(0).notNull(),
	applicationDate: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	interviewDate: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	userId: text().notNull(),
	teamId: text(),
	platformId: text(),
	aiAnalysisCount: integer().default(0).notNull(),
	coverLetterId: text(),
	resumeId: text(),
	status: text().notNull(),
	summary: text(),
}, (table) => [
	index('JobApplication_teamId_idx').using('btree', table.teamId.asc().nullsLast().op('text_ops')),
	index('JobApplication_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'JobApplication_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
	foreignKey({
			columns: [table.platformId],
			foreignColumns: [jobPlatform.id],
			name: 'JobApplication_platformId_fkey',
		}).onUpdate('cascade').onDelete('set null'),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: 'JobApplication_teamId_fkey',
		}).onUpdate('cascade').onDelete('set null'),
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [document.id],
			name: 'JobApplication_resumeId_fkey',
		}).onUpdate('cascade').onDelete('set null'),
	foreignKey({
			columns: [table.coverLetterId],
			foreignColumns: [document.id],
			name: 'JobApplication_coverLetterId_fkey',
		}).onUpdate('cascade').onDelete('set null'),
]);

export const statusHistory = pgTable('StatusHistory', {
	id: text().primaryKey().notNull(),
	changedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	jobId: text().notNull(),
	status: text().notNull(),
}, (table) => [
	index('StatusHistory_jobId_idx').using('btree', table.jobId.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobApplication.id],
			name: 'StatusHistory_jobId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const account = pgTable('Account', {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text('refresh_token'),
	accessToken: text('access_token'),
	expiresAt: integer('expires_at'),
	tokenType: text('token_type'),
	scope: text(),
	idToken: text('id_token'),
	sessionState: text('session_state'),
}, (table) => [
	uniqueIndex('Account_provider_providerAccountId_key').using('btree', table.provider.asc().nullsLast().op('text_ops'), table.providerAccountId.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'Account_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const webhook = pgTable('Webhook', {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	eventType: text().notNull(),
	targetUrl: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex('Webhook_userId_eventType_key').using('btree', table.userId.asc().nullsLast().op('text_ops'), table.eventType.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'Webhook_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const document = pgTable('Document', {
	id: text().primaryKey().notNull(),
	filename: text().notNull(),
	fileKey: text().notNull(),
	type: docType().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	latexSource: text(),
}, (table) => [
	uniqueIndex('Document_fileKey_key').using('btree', table.fileKey.asc().nullsLast().op('text_ops')),
	index('Document_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'Document_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const webhookJob = pgTable('WebhookJob', {
	id: text().primaryKey().notNull(),
	webhookId: text().notNull(),
	payload: jsonb().notNull(),
	status: text().default('PENDING').notNull(),
	attempts: integer().default(0).notNull(),
	lastAttempt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index('WebhookJob_status_lastAttempt_idx').using('btree', table.status.asc().nullsLast().op('text_ops'), table.lastAttempt.asc().nullsLast().op('text_ops')),
	foreignKey({
			columns: [table.webhookId],
			foreignColumns: [webhook.id],
			name: 'WebhookJob_webhookId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
]);

export const teamMembership = pgTable('TeamMembership', {
	role: teamRole().notNull(),
	userId: text().notNull(),
	teamId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'TeamMembership_userId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: 'TeamMembership_teamId_fkey',
		}).onUpdate('cascade').onDelete('cascade'),
	primaryKey({ columns: [table.userId, table.teamId], name: 'TeamMembership_pkey'}),
]);

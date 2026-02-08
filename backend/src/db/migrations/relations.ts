import { relations } from "drizzle-orm/relations";
import { user, customField, customFieldValue, jobApplication, jobPlatform, team, document, statusHistory, account, webhook, webhookJob, teamMembership } from "./schema";

export const customFieldRelations = relations(customField, ({one, many}) => ({
	user: one(user, {
		fields: [customField.userId],
		references: [user.id]
	}),
	customFieldValues: many(customFieldValue),
}));

export const userRelations = relations(user, ({many}) => ({
	customFields: many(customField),
	jobApplications: many(jobApplication),
	accounts: many(account),
	webhooks: many(webhook),
	documents: many(document),
	teamMemberships: many(teamMembership),
}));

export const customFieldValueRelations = relations(customFieldValue, ({one}) => ({
	customField: one(customField, {
		fields: [customFieldValue.customFieldId],
		references: [customField.id]
	}),
	jobApplication: one(jobApplication, {
		fields: [customFieldValue.jobId],
		references: [jobApplication.id]
	}),
}));

export const jobApplicationRelations = relations(jobApplication, ({one, many}) => ({
	customFieldValues: many(customFieldValue),
	user: one(user, {
		fields: [jobApplication.userId],
		references: [user.id]
	}),
	jobPlatform: one(jobPlatform, {
		fields: [jobApplication.platformId],
		references: [jobPlatform.id]
	}),
	team: one(team, {
		fields: [jobApplication.teamId],
		references: [team.id]
	}),
	document_resumeId: one(document, {
		fields: [jobApplication.resumeId],
		references: [document.id],
		relationName: "jobApplication_resumeId_document_id"
	}),
	document_coverLetterId: one(document, {
		fields: [jobApplication.coverLetterId],
		references: [document.id],
		relationName: "jobApplication_coverLetterId_document_id"
	}),
	statusHistories: many(statusHistory),
}));

export const jobPlatformRelations = relations(jobPlatform, ({many}) => ({
	jobApplications: many(jobApplication),
}));

export const teamRelations = relations(team, ({many}) => ({
	jobApplications: many(jobApplication),
	teamMemberships: many(teamMembership),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	jobApplications_resumeId: many(jobApplication, {
		relationName: "jobApplication_resumeId_document_id"
	}),
	jobApplications_coverLetterId: many(jobApplication, {
		relationName: "jobApplication_coverLetterId_document_id"
	}),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
}));

export const statusHistoryRelations = relations(statusHistory, ({one}) => ({
	jobApplication: one(jobApplication, {
		fields: [statusHistory.jobId],
		references: [jobApplication.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const webhookRelations = relations(webhook, ({one, many}) => ({
	user: one(user, {
		fields: [webhook.userId],
		references: [user.id]
	}),
	webhookJobs: many(webhookJob),
}));

export const webhookJobRelations = relations(webhookJob, ({one}) => ({
	webhook: one(webhook, {
		fields: [webhookJob.webhookId],
		references: [webhook.id]
	}),
}));

export const teamMembershipRelations = relations(teamMembership, ({one}) => ({
	user: one(user, {
		fields: [teamMembership.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [teamMembership.teamId],
		references: [team.id]
	}),
}));
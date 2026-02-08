import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

// Select types (what you get from DB)
export type User = InferSelectModel<typeof schema.users>;
export type Account = InferSelectModel<typeof schema.accounts>;
export type RefreshToken = InferSelectModel<typeof schema.refreshTokens>;
export type JobApplication = InferSelectModel<typeof schema.jobApplications>;
export type StatusHistory = InferSelectModel<typeof schema.statusHistory>;
export type JobPlatform = InferSelectModel<typeof schema.jobPlatforms>;
export type Document = InferSelectModel<typeof schema.documents>;
export type CustomField = InferSelectModel<typeof schema.customFields>;
export type CustomFieldValue = InferSelectModel<typeof schema.customFieldValues>;
export type Interview = InferSelectModel<typeof schema.interviews>;
export type Note = InferSelectModel<typeof schema.notes>;
export type DashboardShare = InferSelectModel<typeof schema.dashboardShares>;

// Insert types (what you send to DB)
export type NewUser = InferInsertModel<typeof schema.users>;
export type NewAccount = InferInsertModel<typeof schema.accounts>;
export type NewRefreshToken = InferInsertModel<typeof schema.refreshTokens>;
export type NewJobApplication = InferInsertModel<typeof schema.jobApplications>;
export type NewStatusHistory = InferInsertModel<typeof schema.statusHistory>;
export type NewJobPlatform = InferInsertModel<typeof schema.jobPlatforms>;
export type NewDocument = InferInsertModel<typeof schema.documents>;
export type NewCustomField = InferInsertModel<typeof schema.customFields>;
export type NewCustomFieldValue = InferInsertModel<typeof schema.customFieldValues>;
export type NewInterview = InferInsertModel<typeof schema.interviews>;
export type NewNote = InferInsertModel<typeof schema.notes>;
export type NewDashboardShare = InferInsertModel<typeof schema.dashboardShares>;

// Complex types with relations
export type JobWithRelations = JobApplication & {
  platform?: JobPlatform | null;
  resume?: Document | null;
  coverLetter?: Document | null;
  interviews?: Interview[];
  notes?: Note[];
  statusHistory?: StatusHistory[];
  customFieldValues?: CustomFieldValue[];
};

export type UserWithRelations = User & {
  jobApplications?: JobApplication[];
  customFields?: CustomField[];
  accounts?: Account[];
  documents?: Document[];
  notes?: Note[];
  refreshTokens?: RefreshToken[];
};

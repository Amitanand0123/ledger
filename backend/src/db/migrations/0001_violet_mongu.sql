CREATE TYPE "public"."InterviewType" AS ENUM('PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CULTURAL_FIT', 'FINAL_ROUND', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."JobStatus" AS ENUM('INTERESTED', 'PREPARING', 'READY_TO_APPLY', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "RefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "RefreshToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "Interview" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"type" "InterviewType" DEFAULT 'PHONE_SCREEN' NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"duration" integer,
	"location" text,
	"notes" text,
	"completed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Note" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"jobId" text NOT NULL,
	"userId" text NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DashboardShare" (
	"id" text PRIMARY KEY NOT NULL,
	"ownerId" text NOT NULL,
	"inviteEmail" text NOT NULL,
	"viewerId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "DashboardShare_ownerId_inviteEmail_key" UNIQUE("ownerId","inviteEmail")
);
--> statement-breakpoint
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Team" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Webhook" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "WebhookJob" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "TeamMembership" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "_prisma_migrations" CASCADE;--> statement-breakpoint
DROP TABLE "Team" CASCADE;--> statement-breakpoint
DROP TABLE "Webhook" CASCADE;--> statement-breakpoint
DROP TABLE "WebhookJob" CASCADE;--> statement-breakpoint
DROP TABLE "TeamMembership" CASCADE;--> statement-breakpoint
ALTER TABLE "CustomField" DROP CONSTRAINT "CustomField_userId_fkey";
--> statement-breakpoint
ALTER TABLE "CustomFieldValue" DROP CONSTRAINT "CustomFieldValue_customFieldId_fkey";
--> statement-breakpoint
ALTER TABLE "CustomFieldValue" DROP CONSTRAINT "CustomFieldValue_jobId_fkey";
--> statement-breakpoint
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_userId_fkey";
--> statement-breakpoint
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_platformId_fkey";
--> statement-breakpoint
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_teamId_fkey";
--> statement-breakpoint
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_resumeId_fkey";
--> statement-breakpoint
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_coverLetterId_fkey";
--> statement-breakpoint
ALTER TABLE "StatusHistory" DROP CONSTRAINT "StatusHistory_jobId_fkey";
--> statement-breakpoint
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";
--> statement-breakpoint
DROP INDEX "User_email_key";--> statement-breakpoint
DROP INDEX "JobPlatform_name_key";--> statement-breakpoint
DROP INDEX "CustomField_userId_name_key";--> statement-breakpoint
DROP INDEX "CustomFieldValue_jobId_customFieldId_key";--> statement-breakpoint
DROP INDEX "JobApplication_teamId_idx";--> statement-breakpoint
DROP INDEX "Account_provider_providerAccountId_key";--> statement-breakpoint
DROP INDEX "Document_fileKey_key";--> statement-breakpoint
DROP INDEX "JobApplication_userId_idx";--> statement-breakpoint
DROP INDEX "StatusHistory_jobId_idx";--> statement-breakpoint
DROP INDEX "Document_userId_idx";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "applicationDate" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "applicationDate" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "interviewDate" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DEFAULT 'INTERESTED'::"public"."JobStatus";--> statement-breakpoint
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DATA TYPE "public"."JobStatus" USING "status"::"public"."JobStatus";--> statement-breakpoint
ALTER TABLE "StatusHistory" ALTER COLUMN "changedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "StatusHistory" ALTER COLUMN "changedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "StatusHistory" ALTER COLUMN "status" SET DATA TYPE "public"."JobStatus" USING "status"::"public"."JobStatus";--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailReminders" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "reminderDaysBefore" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobId_JobApplication_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Note" ADD CONSTRAINT "Note_jobId_JobApplication_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DashboardShare" ADD CONSTRAINT "DashboardShare_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DashboardShare" ADD CONSTRAINT "DashboardShare_viewerId_User_id_fk" FOREIGN KEY ("viewerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "Interview_jobId_idx" ON "Interview" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview" USING btree ("scheduledAt");--> statement-breakpoint
CREATE INDEX "Note_jobId_idx" ON "Note" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "Note_userId_idx" ON "Note" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "DashboardShare_ownerId_idx" ON "DashboardShare" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "DashboardShare_viewerId_idx" ON "DashboardShare" USING btree ("viewerId");--> statement-breakpoint
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_jobId_JobApplication_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_CustomField_id_fk" FOREIGN KEY ("customFieldId") REFERENCES "public"."CustomField"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_platformId_JobPlatform_id_fk" FOREIGN KEY ("platformId") REFERENCES "public"."JobPlatform"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_jobId_JobApplication_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "JobApplication_status_idx" ON "JobApplication" USING btree ("status");--> statement-breakpoint
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "JobApplication_deadline_idx" ON "JobApplication" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "JobApplication_applicationDate_idx" ON "JobApplication" USING btree ("applicationDate");--> statement-breakpoint
CREATE INDEX "StatusHistory_changedAt_idx" ON "StatusHistory" USING btree ("changedAt");--> statement-breakpoint
CREATE INDEX "StatusHistory_jobId_changedAt_idx" ON "StatusHistory" USING btree ("jobId","changedAt");--> statement-breakpoint
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "StatusHistory_jobId_idx" ON "StatusHistory" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "Document_userId_idx" ON "Document" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "gcalRefreshToken";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "airtableApiKey";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "airtableBaseId";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "airtableTableName";--> statement-breakpoint
ALTER TABLE "JobApplication" DROP COLUMN "teamId";--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "JobPlatform" ADD CONSTRAINT "JobPlatform_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_userId_name_key" UNIQUE("userId","name");--> statement-breakpoint
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_jobId_customFieldId_key" UNIQUE("jobId","customFieldId");--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileKey_unique" UNIQUE("fileKey");--> statement-breakpoint
DROP TYPE "public"."TeamRole";
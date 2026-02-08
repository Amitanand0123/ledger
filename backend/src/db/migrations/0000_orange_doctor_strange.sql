-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."DocType" AS ENUM('RESUME', 'COVER_LETTER');--> statement-breakpoint
CREATE TYPE "public"."FieldType" AS ENUM('TEXT', 'NUMBER', 'DATE', 'BOOLEAN');--> statement-breakpoint
CREATE TYPE "public"."TeamRole" AS ENUM('OWNER', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"gcalRefreshToken" text,
	"airtableApiKey" text,
	"airtableBaseId" text,
	"airtableTableName" text DEFAULT 'Job Applications'
);
--> statement-breakpoint
CREATE TABLE "JobPlatform" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CustomField" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "FieldType" NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CustomFieldValue" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"customFieldId" text NOT NULL,
	"jobId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "JobApplication" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"position" text NOT NULL,
	"location" text NOT NULL,
	"description" text,
	"url" text,
	"salary" text,
	"salaryMin" integer,
	"salaryMax" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"applicationDate" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"interviewDate" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"userId" text NOT NULL,
	"teamId" text,
	"platformId" text,
	"aiAnalysisCount" integer DEFAULT 0 NOT NULL,
	"coverLetterId" text,
	"resumeId" text,
	"status" text NOT NULL,
	"summary" text
);
--> statement-breakpoint
CREATE TABLE "StatusHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"changedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"jobId" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "Webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"eventType" text NOT NULL,
	"targetUrl" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Document" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"fileKey" text NOT NULL,
	"type" "DocType" NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"latexSource" text
);
--> statement-breakpoint
CREATE TABLE "WebhookJob" (
	"id" text PRIMARY KEY NOT NULL,
	"webhookId" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lastAttempt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeamMembership" (
	"role" "TeamRole" NOT NULL,
	"userId" text NOT NULL,
	"teamId" text NOT NULL,
	CONSTRAINT "TeamMembership_pkey" PRIMARY KEY("userId","teamId")
);
--> statement-breakpoint
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "public"."CustomField"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "public"."JobPlatform"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Document"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "public"."Document"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobApplication"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WebhookJob" ADD CONSTRAINT "WebhookJob_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "public"."Webhook"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "JobPlatform_name_key" ON "JobPlatform" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "CustomField_userId_name_key" ON "CustomField" USING btree ("userId" text_ops,"name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "CustomFieldValue_jobId_customFieldId_key" ON "CustomFieldValue" USING btree ("jobId" text_ops,"customFieldId" text_ops);--> statement-breakpoint
CREATE INDEX "JobApplication_teamId_idx" ON "JobApplication" USING btree ("teamId" text_ops);--> statement-breakpoint
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "StatusHistory_jobId_idx" ON "StatusHistory" USING btree ("jobId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account" USING btree ("provider" text_ops,"providerAccountId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Webhook_userId_eventType_key" ON "Webhook" USING btree ("userId" text_ops,"eventType" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Document_fileKey_key" ON "Document" USING btree ("fileKey" text_ops);--> statement-breakpoint
CREATE INDEX "Document_userId_idx" ON "Document" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "WebhookJob_status_lastAttempt_idx" ON "WebhookJob" USING btree ("status" text_ops,"lastAttempt" text_ops);
*/
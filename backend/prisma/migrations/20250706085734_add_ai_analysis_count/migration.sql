/*
  Warnings:

  - You are about to drop the column `jobApplicationId` on the `CustomFieldValue` table. All the data in the column will be lost.
  - You are about to drop the column `coverLetterFilename` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `coverLetterUrl` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `hrContactEmail` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `hrContactPhone` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `resumeFilename` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `resumeUrl` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `JobPlatform` table. All the data in the column will be lost.
  - You are about to drop the column `jobApplicationId` on the `StatusHistory` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Team` table. All the data in the column will be lost.
  - The primary key for the `TeamMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamMembership` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobId,customFieldId]` on the table `CustomFieldValue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jobId` to the `CustomFieldValue` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `JobApplication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `jobId` to the `StatusHistory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `StatusHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('RESUME', 'COVER_LETTER');

-- DropForeignKey
ALTER TABLE "CustomFieldValue" DROP CONSTRAINT "CustomFieldValue_jobApplicationId_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_teamId_fkey";

-- DropForeignKey
ALTER TABLE "StatusHistory" DROP CONSTRAINT "StatusHistory_jobApplicationId_fkey";

-- DropIndex
DROP INDEX "CustomField_userId_idx";

-- DropIndex
DROP INDEX "CustomFieldValue_jobApplicationId_customFieldId_key";

-- DropIndex
DROP INDEX "JobApplication_applicationDate_idx";

-- DropIndex
DROP INDEX "JobApplication_platformId_idx";

-- DropIndex
DROP INDEX "JobApplication_status_idx";

-- DropIndex
DROP INDEX "StatusHistory_jobApplicationId_idx";

-- DropIndex
DROP INDEX "TeamMembership_userId_teamId_key";

-- AlterTable
ALTER TABLE "CustomField" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CustomFieldValue" DROP COLUMN "jobApplicationId",
ADD COLUMN     "jobId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JobApplication" DROP COLUMN "coverLetterFilename",
DROP COLUMN "coverLetterUrl",
DROP COLUMN "hrContactEmail",
DROP COLUMN "hrContactPhone",
DROP COLUMN "resumeFilename",
DROP COLUMN "resumeUrl",
ADD COLUMN     "aiAnalysisCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coverLetterId" TEXT,
ADD COLUMN     "resumeId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "JobPlatform" DROP COLUMN "iconUrl";

-- AlterTable
ALTER TABLE "StatusHistory" DROP COLUMN "jobApplicationId",
ADD COLUMN     "jobId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "TeamMembership" DROP CONSTRAINT "TeamMembership_pkey",
DROP COLUMN "id",
ALTER COLUMN "role" DROP DEFAULT,
ADD CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("userId", "teamId");

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileKey_key" ON "Document"("fileKey");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_jobId_customFieldId_key" ON "CustomFieldValue"("jobId", "customFieldId");

-- CreateIndex
CREATE INDEX "StatusHistory_jobId_idx" ON "StatusHistory"("jobId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

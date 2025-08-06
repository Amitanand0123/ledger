-- AlterTable
ALTER TABLE "User" ADD COLUMN     "airtableApiKey" TEXT,
ADD COLUMN     "airtableBaseId" TEXT,
ADD COLUMN     "airtableTableName" TEXT DEFAULT 'Job Applications';

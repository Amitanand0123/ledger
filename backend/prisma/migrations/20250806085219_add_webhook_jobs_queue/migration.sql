-- CreateTable
CREATE TABLE "public"."WebhookJob" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookJob_status_lastAttempt_idx" ON "public"."WebhookJob"("status", "lastAttempt");

-- AddForeignKey
ALTER TABLE "public"."WebhookJob" ADD CONSTRAINT "WebhookJob_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "public"."Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

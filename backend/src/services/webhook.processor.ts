import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { Webhook, WebhookJob } from '@prisma/client';

const MAX_ATTEMPTS = 5;

/**
 * Attempts to send a webhook payload.
 * @param job - The webhook job from the database.
 * @param webhook - The parent webhook with the target URL.
 */
async function sendWebhook(job: WebhookJob, webhook: Webhook) {
    try {
        const response = await fetch(webhook.targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job.payload),
            signal: AbortSignal.timeout(10000) // 10-second timeout
        });

        if (response.ok) {
            // Success! Delete the job from the queue.
            await prisma.webhookJob.delete({ where: { id: job.id } });
            logger.info(`Webhook job ${job.id} sent successfully to ${webhook.targetUrl}`);
        } else {
            // The server responded with an error (e.g., 4xx, 5xx). Treat as a failure.
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error: any) {
        // Network error or non-ok response. Mark for retry.
        logger.warn(`Webhook job ${job.id} failed (Attempt ${job.attempts + 1}). Error: ${error.message}`);
        
        if (job.attempts + 1 >= MAX_ATTEMPTS) {
            // Max attempts reached, mark as permanently FAILED.
            await prisma.webhookJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    attempts: { increment: 1 },
                    lastAttempt: new Date(),
                },
            });
        } else {
            // Increment attempt count and keep as PENDING.
            await prisma.webhookJob.update({
                where: { id: job.id },
                data: {
                    attempts: { increment: 1 },
                    lastAttempt: new Date(),
                },
            });
        }
    }
}

/**
 * Periodically checks for and processes pending webhook jobs.
 * This function should be called at a regular interval.
 */
export async function processWebhookQueue() {
    // Find jobs that are pending and haven't been attempted in the last 5 minutes
    // (This creates an exponential backoff effect)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const jobsToProcess = await prisma.webhookJob.findMany({
        where: {
            status: 'PENDING',
            OR: [
                { lastAttempt: null },
                { lastAttempt: { lte: fiveMinutesAgo } }
            ]
        },
        include: { webhook: true },
        take: 20, // Process in batches
    });

    if (jobsToProcess.length > 0) {
        logger.info(`Processing ${jobsToProcess.length} pending webhook jobs...`);
        // Process all found jobs concurrently
        await Promise.all(jobsToProcess.map(job => sendWebhook(job, job.webhook)));
    }
}
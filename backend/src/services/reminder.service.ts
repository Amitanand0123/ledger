import { db } from '../db/client.js';
import { users, interviews, jobApplications } from '../db/schema/index.js';
import { eq, and, gte, lt, isNotNull, inArray } from 'drizzle-orm';
import { sendEmail } from './email.service.js';
import { logger } from '@/utils/logger.js';
import cron from 'node-cron';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const REMINDER_DAYS = [14, 7, 1];

function getDayLabel(daysLeft: number): string {
    if (daysLeft === 1) return 'tomorrow';
    return `in ${daysLeft} days`;
}

/**
 * Checks for upcoming interviews at 14 days, 7 days, and 1 day before
 * and sends reminder emails.
 */
async function checkInterviewReminders() {
    try {
        logger.info('Running interview reminder check...');

        const usersWithReminders = await db
            .select({
                id: users.id,
                email: users.email,
            })
            .from(users)
            .where(and(eq(users.emailReminders, true), isNotNull(users.email)));

        for (const user of usersWithReminders) {
            const userJobIds = db.select({ id: jobApplications.id }).from(jobApplications)
                .where(eq(jobApplications.userId, user.id));

            for (const daysBefore of REMINDER_DAYS) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + daysBefore);
                targetDate.setHours(0, 0, 0, 0);

                const nextDay = new Date(targetDate);
                nextDay.setDate(nextDay.getDate() + 1);

                const upcomingInterviews = await db.query.interviews.findMany({
                    where: and(
                        eq(interviews.completed, false),
                        gte(interviews.scheduledAt, targetDate),
                        lt(interviews.scheduledAt, nextDay),
                        inArray(interviews.jobId, userJobIds)
                    ),
                    with: {
                        job: {
                            columns: {
                                company: true,
                                position: true,
                                userId: true,
                            },
                        },
                    },
                });

                for (const interview of upcomingInterviews) {
                    const interviewDate = new Date(interview.scheduledAt);
                    const formattedDate = interviewDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    const formattedTime = interviewDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    const dayLabel = getDayLabel(daysBefore);
                    const sanitizedCompany = purify.sanitize(interview.job!.company);
                    const sanitizedPosition = purify.sanitize(interview.job!.position);
                    const sanitizedType = purify.sanitize(interview.type.replace(/_/g, ' '));
                    const sanitizedLocation = interview.location ? purify.sanitize(interview.location) : null;
                    const sanitizedNotes = interview.notes ? purify.sanitize(interview.notes) : null;

                    const subject = `Interview ${dayLabel}: ${sanitizedCompany} — ${sanitizedPosition}`;
                    const text = `Reminder: Your ${sanitizedType.toLowerCase()} interview for ${sanitizedPosition} at ${sanitizedCompany} is ${dayLabel}, on ${formattedDate} at ${formattedTime}.`;

                    let html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Interview ${dayLabel}</h2>
                            <p>You have an upcoming interview:</p>
                            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                <p><strong>Company:</strong> ${sanitizedCompany}</p>
                                <p><strong>Position:</strong> ${sanitizedPosition}</p>
                                <p><strong>Type:</strong> ${sanitizedType}</p>
                                <p><strong>Date:</strong> ${formattedDate}</p>
                                <p><strong>Time:</strong> ${formattedTime}</p>
                    `;

                    if (sanitizedLocation) {
                        html += `<p><strong>Location:</strong> ${sanitizedLocation}</p>`;
                    }
                    if (interview.duration) {
                        html += `<p><strong>Duration:</strong> ${interview.duration} minutes</p>`;
                    }
                    if (sanitizedNotes) {
                        html += `<p><strong>Notes:</strong> ${sanitizedNotes}</p>`;
                    }

                    html += `
                            </div>
                            <p style="color: #666;">Good luck with your interview!</p>
                        </div>
                    `;

                    await sendEmail({ to: user.email!, subject, text, html });
                    logger.info(`Sent ${daysBefore}-day interview reminder to ${user.email} for interview ${interview.id}`);
                }
            }
        }

        logger.info('Interview reminder check completed');
    } catch (error) {
        logger.error('Error in checkInterviewReminders:', error);
    }
}

/**
 * Initializes the cron job for sending reminders.
 * Runs every day at 9 AM.
 */
export function initializeReminderCron() {
    cron.schedule('0 9 * * *', async () => {
        logger.info('Starting scheduled reminder check at 9 AM');
        await checkInterviewReminders();
    });

    logger.info('Reminder cron job initialized - will run daily at 9 AM');
}

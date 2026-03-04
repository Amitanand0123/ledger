import { db } from '../db/client.js';
import { users, interviews, jobApplications } from '../db/schema/index.js';
import { eq, and, gte, lt, notInArray, isNotNull, inArray, sql } from 'drizzle-orm';
import { sendEmail } from './email.service.js';
import { logger } from '@/utils/logger.js';
import cron from 'node-cron';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create DOMPurify instance for Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Checks for upcoming interviews and sends reminder emails
 */
async function checkInterviewReminders() {
    try {
        logger.info('Running interview reminder check...');

        const usersWithReminders = await db
            .select({
                id: users.id,
                email: users.email,
                reminderDaysBefore: users.reminderDaysBefore,
            })
            .from(users)
            .where(and(eq(users.emailReminders, true), isNotNull(users.email)));

        for (const user of usersWithReminders) {
            const daysBefore = user.reminderDaysBefore || 1;
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + daysBefore);
            reminderDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(reminderDate);
            nextDay.setDate(nextDay.getDate() + 1);

            // Find interviews for this user's jobs scheduled between reminderDate and nextDay
            const userJobIds = db.select({ id: jobApplications.id }).from(jobApplications)
                .where(eq(jobApplications.userId, user.id));

            const validInterviews = await db.query.interviews.findMany({
                where: and(
                    eq(interviews.completed, false),
                    gte(interviews.scheduledAt, reminderDate),
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

            // Send reminder for each upcoming interview
            for (const interview of validInterviews) {
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

                const subject = `Reminder: Interview with ${interview.job!.company}`;
                const text = `You have an upcoming ${interview.type.replace(/_/g, ' ').toLowerCase()} interview for ${interview.job!.position} at ${interview.job!.company} on ${formattedDate} at ${formattedTime}.`;

                // Sanitize all user-provided data to prevent XSS
                const sanitizedCompany = purify.sanitize(interview.job!.company);
                const sanitizedPosition = purify.sanitize(interview.job!.position);
                const sanitizedType = purify.sanitize(interview.type.replace(/_/g, ' '));
                const sanitizedLocation = interview.location ? purify.sanitize(interview.location) : null;
                const sanitizedNotes = interview.notes ? purify.sanitize(interview.notes) : null;

                let html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Interview Reminder</h2>
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

                await sendEmail({
                    to: user.email!,
                    subject,
                    text,
                    html,
                });

                logger.info(`Sent interview reminder to ${user.email} for interview ${interview.id}`);
            }
        }

        logger.info('Interview reminder check completed');
    } catch (error) {
        logger.error('Error in checkInterviewReminders:', error);
    }
}

/**
 * Checks for approaching deadlines and sends reminder emails
 */
async function checkDeadlineReminders() {
    try {
        logger.info('Running deadline reminder check...');

        const usersWithReminders = await db
            .select({
                id: users.id,
                email: users.email,
                reminderDaysBefore: users.reminderDaysBefore,
            })
            .from(users)
            .where(and(eq(users.emailReminders, true), isNotNull(users.email)));

        for (const user of usersWithReminders) {
            const daysBefore = user.reminderDaysBefore || 1;
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + daysBefore);
            reminderDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(reminderDate);
            nextDay.setDate(nextDay.getDate() + 1);

            // Find job applications with deadlines approaching
            const jobsWithDeadlines = await db
                .select()
                .from(jobApplications)
                .where(
                    and(
                        eq(jobApplications.userId, user.id),
                        isNotNull(jobApplications.deadline),
                        gte(jobApplications.deadline, reminderDate),
                        lt(jobApplications.deadline, nextDay),
                        notInArray(jobApplications.status, ['REJECTED', 'ACCEPTED', 'WITHDRAWN'])
                    )
                );

            // Send reminder for each approaching deadline
            for (const job of jobsWithDeadlines) {
                const deadlineDate = new Date(job.deadline!);
                const formattedDate = deadlineDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });

                // Sanitize user-provided data for deadline reminder
                const sanitizedCompany = purify.sanitize(job.company);
                const sanitizedPosition = purify.sanitize(job.position);
                const sanitizedStatus = purify.sanitize(job.status);

                const subject = `Reminder: Application deadline for ${sanitizedCompany}`;
                const text = `The application deadline for ${sanitizedPosition} at ${sanitizedCompany} is approaching on ${formattedDate}.`;

                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Application Deadline Reminder</h2>
                        <p>You have an upcoming application deadline:</p>
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
                            <p><strong>Company:</strong> ${sanitizedCompany}</p>
                            <p><strong>Position:</strong> ${sanitizedPosition}</p>
                            <p><strong>Deadline:</strong> ${formattedDate}</p>
                            <p><strong>Status:</strong> ${sanitizedStatus}</p>
                        </div>
                        <p style="color: #666;">Make sure to complete your application before the deadline!</p>
                    </div>
                `;

                await sendEmail({
                    to: user.email!,
                    subject,
                    text,
                    html,
                });

                logger.info(`Sent deadline reminder to ${user.email} for job ${job.id}`);
            }
        }

        logger.info('Deadline reminder check completed');
    } catch (error) {
        logger.error('Error in checkDeadlineReminders:', error);
    }
}

/**
 * Runs both reminder checks
 */
export async function checkReminders() {
    await Promise.all([
        checkInterviewReminders(),
        checkDeadlineReminders(),
    ]);
}

/**
 * Initializes the cron job for sending reminders
 * Runs every day at 9 AM
 */
export function initializeReminderCron() {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
        logger.info('Starting scheduled reminder check at 9 AM');
        await checkReminders();
    });

    logger.info('Reminder cron job initialized - will run daily at 9 AM');
}

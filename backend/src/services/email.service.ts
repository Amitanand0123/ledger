import { Resend } from 'resend';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

let resend: Resend | null = null;

export const initializeEmailService = async () => {
    if (!config.resendApiKey) {
        logger.warn('RESEND_API_KEY not configured. Email sending will be disabled.');
        return;
    }

    try {
        resend = new Resend(config.resendApiKey);
        logger.info('Email service (Resend) is configured and ready.');
    } catch (error) {
        logger.error('Failed to initialize Resend email service:', error);
        resend = null;
    }
};

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions) => {
    if (!resend) {
        logger.warn(`Skipping email to "${options.to}" because the email service is not initialized.`);
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: config.emailFrom,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        if (error) {
            logger.error(`Resend error sending email to "${options.to}":`, error);
            return;
        }

        logger.info(`Email sent successfully to "${options.to}". ID: ${data?.id}`);
    } catch (error) {
        logger.error(`Error sending email to "${options.to}":`, error);
    }
};

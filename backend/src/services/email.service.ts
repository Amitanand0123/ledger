import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

let transporter: nodemailer.Transporter;

export const initializeEmailService = async () => {
    if (!config.email.user || !config.email.pass || !config.email.host) {
        logger.warn('Email service environment variables not fully configured. Email sending will be disabled.');
        return;
    }

    try {
        transporter = nodemailer.createTransport({
            host: config.email.host,
            port: Number(config.email.port),
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });

        await transporter.verify();
        logger.info('Email service is configured and ready to send real emails.');

    } catch (error) {
        logger.error('Failed to initialize or verify email service:', error);
        transporter = null!; 
    }
};

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions) => {
    if (!transporter) {
        logger.warn(`Skipping email to "${options.to}" because the email service is not initialized.`);
        return;
    }
    
    try {
        const info = await transporter.sendMail({
            from: `"Ledger" <${config.email.user}>`,
            ...options,
        });
        logger.info(`Email sent successfully to "${options.to}". Message ID: ${info.messageId}`);
    } catch (error) {
        logger.error(`Error sending email to "${options.to}":`, error);
    }
};
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export const initializeEmailService = async () => {
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('Email service initialized with Ethereal.');
    } catch (error) {
        console.error('Failed to initialize email service:', error);
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
        console.warn('Email service has not been initialized. Skipping email.');
        return;
    }
    try {
        const info = await transporter.sendMail({
            from: '"Ledger" <noreply@ledger.pro>',
            ...options,
        });
        console.log('Email sent successfully: %s', info.messageId);
        console.log('Preview email at: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
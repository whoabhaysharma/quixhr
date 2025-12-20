import nodemailer from 'nodemailer';
import { config } from '../config';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.password',
    },
});

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${config.app.env === 'development' ? 'http://localhost:3000' : process.env.APP_URL}/api/auth/verify-email?token=${token}`;

    const message = {
        from: `"${config.app.name}" <${process.env.SMTP_FROM || 'noreply@quixhr.com'}>`, // sender address
        to: to, // list of receivers
        subject: 'Verify your email address', // Subject line
        text: `Please verify your email by clicking the following link: ${verificationUrl}`, // plain text body
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to ${config.app.name}!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `, // html body
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Could not send verification email');
    }
};

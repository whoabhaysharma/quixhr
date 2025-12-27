import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const emailService = {
    async sendWelcomeEmail(email: string, name: string) {
        const mailOptions = {
            from: process.env.AWS_FROM_EMAIL || "noreply@quixhr.com",
            to: email,
            subject: "Welcome to QuixHR!",
            text: `Welcome, ${name}! Thank you for joining QuixHR. We're excited to have you on board.`,
            html: `
                <h1>Welcome, ${name}!</h1>
                <p>Thank you for joining QuixHR. We're excited to have you on board.</p>
                <p>Get started by exploring your dashboard.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't throw, as this shouldn't block the auth flow
        }
    },

    async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.AWS_FROM_EMAIL || "noreply@quixhr.com",
            to: email,
            subject: "Reset your QuixHR Password",
            text: `Password Reset Request. Click the link to reset your password: ${resetLink}`,
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error("Failed to send password reset email:", error);
            throw new Error("Failed to send password reset email");
        }
    },

    async sendOtpEmail(email: string, otp: string) {
        const mailOptions = {
            from: process.env.AWS_FROM_EMAIL || "noreply@quixhr.com",
            to: email,
            subject: "QuixHR Email Verification",
            text: `Your Verification Code is: ${otp}. This code will expire in 10 minutes.`,
            html: `
                <h1>Email Verification</h1>
                <p>Your verification code is:</p>
                <h2 style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</h2>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP email sent to ${email}`);
        } catch (error) {
            console.error("Failed to send OTP email:", error);
            throw new Error("Failed to send OTP email");
        }
    },
    async sendInviteEmail(email: string, token: string, role: string) {
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?token=${token}`;

        const mailOptions = {
            from: process.env.AWS_FROM_EMAIL || "noreply@quixhr.com",
            to: email,
            subject: "You've been invited to join QuixHR",
            text: `You have been invited to join QuixHR as a ${role}. Click the link to join: ${inviteLink}`,
            html: `
                <h1>Invitation to join QuixHR</h1>
                <p>You have been invited to join the organization as a <strong>${role}</strong>.</p>
                <p>Click the button below to accept the invitation and set up your account:</p>
                <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
                <p>or copy this link: ${inviteLink}</p>
                <p>This link will expire in 7 days.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Invite email sent to ${email}`);
        } catch (error) {
            console.error("Failed to send invite email:", error);
            throw new Error("Failed to send invite email");
        }
    }
};

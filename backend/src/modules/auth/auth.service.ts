import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../../shared/config';
import prisma from '../../shared/services/prisma';
import { userService } from '../users/users.service';
import { Role } from '@prisma/client';
import { emailService } from '../../shared/services/email.service';

export const authService = {
    async login(email: string, password: string) {
        const user = await userService.findByEmail(email);

        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
            },
            config.jwt.secret,
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return {
            token,
            user: userWithoutPassword,
        };
    },

    // In-memory OTP store: Map<email, { otp: string, expires: number }>
    // In production, use Redis for this
    _otpStore: new Map<string, { otp: string, expires: number }>(),

    async sendVerificationOtp(email: string) {
        const existingUser = await userService.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists. Please login.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        this._otpStore.set(email, { otp, expires });

        await emailService.sendOtpEmail(email, otp);
        return { message: 'Verification code sent' };
    },

    async registerWithEmail(email: string, password: string, name: string, otp: string, organizationName: string) {
        try {
            // 1. Verify OTP
            const storedOtp = this._otpStore.get(email);
            if (!storedOtp) {
                throw new Error('Verification code not found or expired. Please request a new one.');
            }

            if (storedOtp.expires < Date.now()) {
                this._otpStore.delete(email);
                throw new Error('Verification code expired. Please request a new one.');
            }

            if (storedOtp.otp !== otp) {
                throw new Error('Invalid verification code.');
            }

            // Cleanup OTP
            this._otpStore.delete(email);

            const existingUser = await userService.findByEmail(email);
            if (existingUser) {
                throw new Error('User already exists. Please login.');
            }

            // 2. Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Create User and Organization Transactionally
            const isSuperAdmin = email === config.superAdminEmail;
            const role = isSuperAdmin ? Role.SUPER_ADMIN : Role.ADMIN; // SaaS Owner (Admin)

            const newUser = await prisma.$transaction(async (tx) => {
                // Create Organization
                const org = await tx.organization.create({
                    data: {
                        name: organizationName,
                    }
                });

                // Create User
                return tx.user.create({
                    data: {
                        email,
                        name,
                        password: hashedPassword,
                        role: role,
                        organizationId: org.id
                    }
                });
            });

            // 4. Generate JWT
            const token = jwt.sign(
                {
                    id: newUser.id,
                    name: newUser.name,
                    role: newUser.role,
                    organizationId: newUser.organizationId,
                },
                config.jwt.secret,
                { expiresIn: '1d' }
            );

            // 5. Send Welcome Email
            try {
                await emailService.sendWelcomeEmail(email, name);
            } catch (emailError) {
                console.error('Failed to send welcome email (registration):', emailError);
            }

            const { password: _, ...userWithoutPassword } = newUser;

            return {
                token,
                user: userWithoutPassword
            };

        } catch (error) {
            console.error('Register With Email Error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Registration failed');
        }
    },

    async registerWithInvite(token: string, name: string, password: string) {
        try {
            // 1. Validate Invite
            // We need to dynamically import to avoid circular dependencies if any, 
            // but inviteService doesn't import authService, so static import is fine.
            // However, sticking to the importing at top of file.
            // Adding import for inviteService at top of file in next step if needed, 
            // but for now let's assume it's available or we add it.
            // Wait, I haven't added the import yet. I should add it first or use dynamic import.
            const { inviteService } = require('./inviteService');

            const invite = await inviteService.validateInvite(token);

            // 2. Check if invite is already accepted (Idempotency for race conditions)
            if (invite.acceptedAt) {
                const existingUser = await userService.findByEmail(invite.email);
                if (existingUser) {
                    // Generate login token for the existing user (auto-login after duplicate join)
                    const token = jwt.sign(
                        {
                            id: existingUser.id,
                            name: existingUser.name,
                            role: existingUser.role,
                            organizationId: existingUser.organizationId,
                        },
                        config.jwt.secret,
                        { expiresIn: '1d' }
                    );
                    const { password: _, ...userWithoutPassword } = existingUser;
                    return { token, user: userWithoutPassword };
                }
                // If invite accepted but user not found -> weird state, let it proceed to double-check email?
                // No, if accepted, we assume done.
                throw new Error("Invitation already used.");
            }

            // 3. Check if user exists (should have been checked at createInvite, but valid double check)
            const existingUser = await userService.findByEmail(invite.email);
            if (existingUser) {
                // If user exists but invite NOT accepted?
                // Might be invited to join existing account?
                // For now, assume register flow requires new user or we'd redirect to login.
                throw new Error('User already exists. Please login to accept the invitation.');
            }

            // 4. Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 5. Create User and Mark Invite Accepted Transactionally
            const newUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: invite.email,
                        name,
                        password: hashedPassword,
                        role: invite.role,
                        organizationId: invite.organizationId
                    }
                });

                await tx.invite.update({
                    where: { id: invite.id },
                    data: { acceptedAt: new Date() }
                });

                return user;
            });

            // 6. Generate JWT
            const jwtToken = jwt.sign(
                {
                    id: newUser.id,
                    name: newUser.name,
                    role: newUser.role,
                    organizationId: newUser.organizationId,
                },
                config.jwt.secret,
                { expiresIn: '1d' }
            );

            // 7. Send Welcome Email
            try {
                await emailService.sendWelcomeEmail(newUser.email, newUser.name || 'User');
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Don't fail the request if email fails
            }

            const { password: _, ...userWithoutPassword } = newUser;

            return {
                token: jwtToken,
                user: userWithoutPassword
            };

        } catch (error) {
            console.error('Register With Invite Error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Registration failed');
        }
    },

    async forgotPassword(email: string) {
        try {
            const user = await userService.findByEmail(email);
            if (!user) {
                // Return success even if user not found to prevent enumeration
                return { message: 'If an account exists, a reset link has been sent.' };
            }

            // Generate a reset token (valid for 1 hour)
            const resetToken = jwt.sign(
                { id: user.id, purpose: 'password_reset' },
                config.jwt.secret,
                { expiresIn: '1h' }
            );

            await emailService.sendPasswordResetEmail(email, resetToken);

            return { message: 'If an account exists, a reset link has been sent.' };
        } catch (error) {
            console.error('Forgot Password Error:', error);
            throw new Error('Could not request password reset');
        }
    },

    async resetPassword(token: string, newPassword: string) {
        try {
            // Verify Token
            const decoded = jwt.verify(token, config.jwt.secret) as any;

            if (decoded.purpose !== 'password_reset') {
                throw new Error('Invalid token purpose');
            }

            const userId = decoded.id;

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            return { message: 'Password updated successfully' };

        } catch (error) {
            console.error('Reset Password Error:', error);
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Reset link has expired. Please request a new one.');
            }
            throw new Error('Invalid or expired reset token');
        }
    }
};

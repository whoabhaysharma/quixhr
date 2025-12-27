import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    LoginDto,
    RegisterDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    AuthResponseDto,
} from './auth.types';
import { queueLoginAlert, queueWelcomeEmail, queueVerificationEmail, queuePasswordResetEmail } from '../notification/notification.producer';
import { config } from '../../config';
import { generateVerificationToken, storeVerificationToken, verifyToken } from './email-verification.service';

const prisma = new PrismaClient();

// JWT Configuration
const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

/**
 * Generate JWT token
 */
function generateToken(payload: {
    id: string;
    email: string;
    role: string;
    employeeId?: string;
    companyId?: string;
}): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
}

/**
 * Login user
 */
export async function login(dto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email: dto.email },
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                    companyId: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    // Generate token
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
        companyId: user.employee?.companyId,
    });

    // Queue login alert email
    if (user.employee) {
        await queueLoginAlert(
            user.email,
            user.employee.name,
            ipAddress || 'Unknown'
        ).catch(err => {
            console.error('Failed to queue login alert:', err);
            // Don't fail login if email fails
        });
    }

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            employee: user.employee || undefined,
        },
    };
}

/**
 * Register new user with company
 */
export async function register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user, company, and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create user first (to be the owner)
        const user = await tx.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: Role.HR_ADMIN, // First user is HR admin (owner)
                emailVerified: false,
            },
        });

        // Create company with ownerId
        const company = await tx.company.create({
            data: {
                name: dto.companyName,
                timezone: 'UTC',
            },
        });

        // Create employee
        const employee = await tx.employee.create({
            data: {
                userId: user.id,
                companyId: company.id,
                name: dto.name,
                status: 'ACTIVE',
            },
        });

        return { user, employee, company };
    });

    // Generate verification token and store in Redis
    const verificationToken = generateVerificationToken();
    await storeVerificationToken(verificationToken, result.user.id);

    // Queue verification email
    await queueVerificationEmail(result.user.email, dto.name, verificationToken).catch(err => {
        console.error('Failed to queue verification email:', err);
    });

    return {
        message: 'Registration successful! Please check your email to verify your account.',
        userId: result.user.id,
    };
}

/**
 * Forgot password - generate reset token
 */
export async function forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
        where: { email: dto.email },
    });

    if (!user) {
        // Don't reveal if user exists
        return { message: 'If the email exists, a reset link has been sent' };
    }

    if (!user.emailVerified) {
        throw new Error('Please verify your email address before resetting your password');
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
        { id: user.id, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Send password reset email
    await queuePasswordResetEmail(user.email, resetToken).catch(err => {
        console.error('Failed to queue password reset email:', err);
    });

    return {
        message: 'If the email exists, a reset link has been sent',
    };
}

/**
 * Reset password with token
 */
export async function resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
        // Verify token
        const decoded = jwt.verify(dto.token, JWT_SECRET) as any;

        if (decoded.purpose !== 'password_reset') {
            throw new Error('Invalid token');
        }

        // Check if user exists and is verified
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.emailVerified) {
            throw new Error('Email not verified. Please verify your email before resetting password.');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword },
        });

        return { message: 'Password reset successful' };
    } catch (error: any) {
        // Pass through specific errors, otherwise generic invalid token
        if (error.message.includes('Email not verified') || error.message.includes('User not found')) {
            throw error;
        }
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get current user
 */
export async function getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            employee: {
                select: {
                    id: true,
                    name: true,
                    companyId: true,
                    status: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
    // Verify token and get user ID from Redis
    const userId = await verifyToken(token);

    if (!userId) {
        throw new Error('Invalid or expired verification token');
    }

    // Update user email verified status
    const user = await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
        include: {
            employee: true,
        },
    });

    // Send welcome email now that email is verified
    if (user.employee) {
        await queueWelcomeEmail(user.email, user.employee.name).catch(err => {
            console.error('Failed to queue welcome email:', err);
        });
    }

    return {
        message: 'Email verified successfully! You can now log in.',
    };
}

// Export service object for backward compatibility
export const authService = {
    login,
    register,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    verifyEmail,
};

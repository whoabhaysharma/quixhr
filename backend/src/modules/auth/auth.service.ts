import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { AppError } from '@/utils/appError';
import prisma from '@/utils/prisma';

/**
 * Utility to generate JWT
 */
const signToken = (userId: string, role: Role, companyId: string) => {
    return jwt.sign(
        { userId, role, companyId },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );
};

/**
 * 1. REGISTER COMPANY (Atomic Transaction)
 */
export const registerCompany = async (data: any) => {
    const { email, password, companyName, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already registered', 400);

    const hashedPassword = await bcrypt.hash(password, 12);

    // Execute as a single transaction
    return await prisma.$transaction(async (tx) => {
        // A. Create Company
        const company = await tx.company.create({
            data: { name: companyName },
        });

        // B. Create User (ORG_ADMIN is the owner role)
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.ORG_ADMIN,
            },
        });

        // C. Create Employee Profile linked to User and Company
        const employee = await tx.employee.create({
            data: {
                userId: user.id,
                companyId: company.id,
                firstName: firstName || 'Admin',
                lastName: lastName || 'User',
                status: 'ACTIVE',
                joiningDate: new Date(),
            },
        });

        const token = signToken(user.id, user.role, company.id);

        return {
            token,
            user: { id: user.id, email: user.email, role: user.role, companyId: company.id },
            company: { id: company.id, name: company.name },
        };
    });
};

/**
 * 2. LOGIN
 */
export const login = async (data: any) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        include: { employee: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    const companyId = user.employee?.companyId || '';
    const token = signToken(user.id, user.role, companyId);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId
        },
    };
};

/**
 * 3. ACCEPT INVITATION (Onboarding Employees)
 */
export const acceptInvitation = async (data: any) => {
    const { token, password, firstName, lastName } = data;

    // Find valid invitation
    const invitation = await prisma.invitation.findUnique({
        where: { token },
    });

    if (!invitation || invitation.status !== 'PENDING') {
        throw new AppError('Invalid or expired invitation link', 400);
    }

    if (invitation.expiresAt < new Date()) {
        throw new AppError('Invitation has expired', 400);
    }

    // Check if user already exists (edge case)
    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Atomic Transaction
    return await prisma.$transaction(async (tx) => {
        // A. Create User
        const user = await tx.user.create({
            data: {
                email: invitation.email,
                password: hashedPassword,
                role: invitation.role,
                isEmailVerified: true, // Verified by clicking email link
            },
        });

        // B. Create Employee
        await tx.employee.create({
            data: {
                userId: user.id,
                companyId: invitation.companyId,
                firstName,
                lastName,
                status: 'ACTIVE',
                joiningDate: new Date(),
            },
        });

        // C. Update Invitation Status
        await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
        });

        const token = signToken(user.id, user.role, invitation.companyId);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: invitation.companyId
            },
        };
    });
};

/**
 * 4. FORGOT PASSWORD
 */
export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // Rate limiting (2 min)
    if (user.lastPasswordResetRequest && (Date.now() - user.lastPasswordResetRequest.getTime() < 120000)) {
        throw new AppError('Please wait before requesting again', 429);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
            lastPasswordResetRequest: new Date(),
        },
    });

    console.log(`>>> RESET TOKEN FOR ${email}: ${resetToken}`);
    // await sendEmail(...)
};

/**
 * 5. RESET PASSWORD
 */
export const resetPassword = async (token: string, newPass: string) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() },
        },
    });

    if (!user) throw new AppError('Token is invalid or has expired', 400);

    const hashedPassword = await bcrypt.hash(newPass, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });
};

/**
 * 6. UPDATE PASSWORD (LOGGED IN)
 */
export const updatePassword = async (userId: string, currentPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPass, user.password))) {
        throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
};

/**
 * 7. GET USER BY ID
 */
export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            employee: {
                select: {
                    firstName: true,
                    lastName: true,
                    company: { select: { name: true, id: true } },
                },
            },
        },
    });

    if (!user) throw new AppError('User no longer exists', 404);
    return user;
};
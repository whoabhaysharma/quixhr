import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import {
    SendInvitationDTO,
    InvitationFilters,
    AcceptInvitationDTO,
    ValidateTokenResponse,
} from './invitation.types';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Send an invitation
 */
export const sendInvitation = async (
    companyId: string,
    inviterRole: Role,
    data: SendInvitationDTO
) => {
    // Import role hierarchy check
    const { canInviteRole } = await import('@/utils/roleHierarchy');

    // Check if inviter can invite this role
    if (!canInviteRole(inviterRole, data.role)) {
        throw new AppError(
            `You cannot invite users with role ${data.role}. You can only invite roles equal to or lower than your own.`,
            403
        );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // Check if there's already a pending invitation
    const existingInvite = await prisma.invitation.findFirst({
        where: {
            email: data.email,
            companyId,
            status: 'PENDING',
        },
    });

    if (existingInvite) {
        throw new AppError('An invitation for this email is already pending', 400);
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
        data: {
            companyId,
            email: data.email,
            role: data.role,
            token,
            expiresAt,
            status: 'PENDING',
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    // TODO: Send invitation email
    console.log(`>>> INVITATION TOKEN FOR ${data.email}: ${token}`);
    console.log(`>>> Invitation link: ${process.env.FRONTEND_URL}/join?token=${token}`);

    return invitation;
};

/**
 * List invitations for a company
 */
export const listInvitations = async (companyId: string, filters: InvitationFilters) => {
    const where: any = { companyId };

    if (filters.status) {
        where.status = filters.status;
    }

    const invitations = await prisma.invitation.findMany({
        where,
        orderBy: {
            expiresAt: 'desc',
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            expiresAt: true,
        },
    });

    return invitations;
};

/**
 * Revoke an invitation
 */
export const revokeInvitation = async (invitationId: string, companyId: string) => {
    const invitation = await prisma.invitation.findFirst({
        where: {
            id: invitationId,
            companyId,
        },
    });

    if (!invitation) {
        throw new AppError('Invitation not found', 404);
    }

    if (invitation.status !== 'PENDING') {
        throw new AppError('Only pending invitations can be revoked', 400);
    }

    const updated = await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'REVOKED' },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
        },
    });

    return updated;
};

/**
 * Validate invitation token (Public)
 */
export const validateToken = async (token: string): Promise<ValidateTokenResponse> => {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
            company: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!invitation) {
        return {
            valid: false,
            error: 'Invalid invitation token',
        };
    }

    if (invitation.status !== 'PENDING') {
        return {
            valid: false,
            error: 'This invitation has already been used or revoked',
        };
    }

    if (invitation.expiresAt < new Date()) {
        return {
            valid: false,
            error: 'This invitation has expired',
        };
    }

    return {
        valid: true,
        invitation: {
            email: invitation.email,
            role: invitation.role,
            companyName: invitation.company.name,
            expiresAt: invitation.expiresAt,
        },
    };
};

/**
 * Accept invitation (Public)
 */
export const acceptInvitation = async (data: AcceptInvitationDTO) => {
    // Find valid invitation
    const invitation = await prisma.invitation.findUnique({
        where: { token: data.token },
    });

    if (!invitation || invitation.status !== 'PENDING') {
        throw new AppError('Invalid or expired invitation link', 400);
    }

    if (invitation.expiresAt < new Date()) {
        throw new AppError('Invitation has expired', 400);
    }

    // Check if user already exists (edge case)
    const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
    });

    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
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
                firstName: data.firstName,
                lastName: data.lastName,
                status: 'ACTIVE',
                joiningDate: new Date(),
            },
        });

        // C. Update Invitation Status
        await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, companyId: invitation.companyId },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: invitation.companyId,
            },
        };
    });

    return result;
};

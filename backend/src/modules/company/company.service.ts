import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { CompanySettingsDTO, InviteUserDTO, UpdateUserRoleDTO, InvitationFilters } from './company.types';
import { Role } from '@prisma/client';
import crypto from 'crypto';

/**
 * Get company settings
 */
export const getCompanySettings = async (companyId: string) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            id: true,
            name: true,
            timezone: true,
            currency: true,
            dateFormat: true,
            logoUrl: true,
            createdAt: true,
        },
    });

    if (!company) throw new AppError('Company not found', 404);

    return company;
};

/**
 * Update company settings
 */
export const updateCompanySettings = async (companyId: string, data: CompanySettingsDTO) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) throw new AppError('Company not found', 404);

    const updated = await prisma.company.update({
        where: { id: companyId },
        data: {
            timezone: data.timezone,
            currency: data.currency,
            dateFormat: data.dateFormat,
            logoUrl: data.logoUrl,
        },
        select: {
            id: true,
            name: true,
            timezone: true,
            currency: true,
            dateFormat: true,
            logoUrl: true,
        },
    });

    return updated;
};

/**
 * Invite a new user
 */
export const inviteUser = async (companyId: string, inviterRole: Role, data: InviteUserDTO) => {
    // Import role hierarchy check
    const { canInviteRole } = await import('@/utils/roleHierarchy');

    // Check if inviter can invite this role
    if (!canInviteRole(inviterRole, data.role as Role)) {
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
            role: data.role as Role,
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
 * List invitations
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
 * List all users in the company
 */
export const listUsers = async (companyId: string, roleFilter?: Role) => {
    const where: any = {
        employee: {
            companyId,
        },
    };

    if (roleFilter) {
        where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                    joiningDate: true,
                },
            },
        },
        orderBy: {
            email: 'asc',
        },
    });

    return users;
};

/**
 * Update user role (Promote/Demote)
 */
export const updateUserRole = async (userId: string, companyId: string, updaterRole: Role, data: UpdateUserRoleDTO) => {
    // Import role hierarchy check
    const { canModifyRole } = await import('@/utils/roleHierarchy');

    // Verify user belongs to the company
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            employee: {
                companyId,
            },
        },
        include: {
            employee: true,
        },
    });

    if (!user) {
        throw new AppError('User not found in this company', 404);
    }

    // Prevent changing SUPER_ADMIN role
    if (user.role === Role.SUPER_ADMIN || data.role === Role.SUPER_ADMIN) {
        throw new AppError('Cannot modify SUPER_ADMIN role', 403);
    }

    // Check if updater can modify this user's role
    if (!canModifyRole(updaterRole, user.role, data.role as Role)) {
        throw new AppError(
            'You cannot modify this user\'s role. You can only modify roles lower than your own and assign roles equal to or lower than your own.',
            403
        );
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: data.role as Role },
        select: {
            id: true,
            email: true,
            role: true,
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return updated;
};

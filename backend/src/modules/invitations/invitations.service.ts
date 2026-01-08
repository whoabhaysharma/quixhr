import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy } from '@/utils/prismaHelpers';

import {
    CreateInvitationInput,
    AcceptInvitationInput,
    GetInvitationsQuery,
} from './invitations.schema';

export class InvitationService {
    static async createInvitation(
        organizationId: string,
        data: CreateInvitationInput
    ) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        // Check for pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                organizationId,
                email: data.email,
                status: 'PENDING',
            },
        });

        if (existingInvitation) {
            throw new AppError('Invitation already sent to this email', 400);
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Fetch organization details for the email
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true }
        });

        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        const invitation = await prisma.invitation.create({
            data: {
                organizationId,
                email: data.email,
                role: data.role,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });

        // Send Invitation Email
        const { sendEmail } = require('@/infra/email/email.service');
        const { config } = require('@/config');

        // Construct invite link (User will click this to accept)
        // Adjust frontend URL as needed
        const inviteLink = `${config.frontend.url}/accept-invite?token=${token}`;

        await sendEmail({
            to: data.email,
            subject: `Invitation to join ${organization.name}`,
            template: 'invite-user',
            data: {
                inviteLink,
                organizationName: organization.name,
                role: data.role
            }
        });

        return invitation;
    }

    static async getInvitations(
        organizationId: string,
        pagination: ParsedPagination,
        filters: Partial<GetInvitationsQuery>
    ) {
        const { page, limit, skip, sortBy, sortOrder, search } = pagination;
        const { status, email } = filters;

        const where: any = { organizationId };

        if (status) where.status = status;
        if (email || search) {
            where.email = {
                contains: email || search,
                mode: 'insensitive',
            };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['email', 'role', 'status', 'expiresAt', 'createdAt'],
            defaultSort: { expiresAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.invitation.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
            }),
            prisma.invitation.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async verifyInvitationToken(token: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new AppError('Invalid invitation token', 404);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Invitation has already been used or cancelled', 400);
        }

        if (new Date() > invitation.expiresAt) {
            throw new AppError('Invitation has expired', 400);
        }

        return {
            email: invitation.email,
            role: invitation.role,
            organizationName: invitation.organization.name,
            organizationId: invitation.organization.id,
            expiresAt: invitation.expiresAt,
        };
    }

    static async acceptInvitation(token: string, userData: AcceptInvitationInput) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { organization: true },
        });

        if (!invitation) {
            throw new AppError('Invalid invitation token', 404);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Invitation has already been used or cancelled', 400);
        }

        if (new Date() > invitation.expiresAt) {
            throw new AppError('Invitation has expired', 400);
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email },
        });

        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(userData.password, 12);

        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: invitation.email,
                    password: hashedPassword,
                    role: invitation.role,
                    isEmailVerified: true,
                },
            });

            const employee = await tx.employee.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: user.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    status: 'ACTIVE',
                    joiningDate: new Date(),
                },
            });

            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' },
            });

            // Queue notification for admins (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
            // Find admin users in the organization
            const adminUsers = await tx.user.findMany({
                where: {
                    role: { in: ['ORG_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'] },
                    employee: {
                        organizationId: invitation.organizationId,
                    },
                },
                select: {
                    id: true,
                },
            });

            // Queue notifications for all admins
            const { addNotificationToQueue } = require('@/infra/queues/notification.queue');
            const { NotificationType } = require('@/constants');

            for (const admin of adminUsers) {
                await addNotificationToQueue(
                    admin.id,
                    NotificationType.INVITATION_ACCEPTED,
                    {
                        employeeName: `${userData.firstName} ${userData.lastName}`,
                        email: invitation.email,
                    }
                );
            }

            return { user, employee };
        });
    }

    static async resendInvitation(invitationId: string, organizationId: string, userRole: Role) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        // Strict RBAC: Can only resend if user has higher rank than invitation role?
        // Actually, logical requirement says "cannot manage upper role".
        // Let's import role hierarchy check
        const { canManageRole } = require('@/utils/roleHierarchy');
        if (!canManageRole(userRole, invitation.role)) {
            throw new AppError('You cannot manage this invitation. You can only manage invitations for roles lower than yours.', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only resend pending invitations', 400);
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { token, expiresAt },
        });

        // Fetch Organization for email (optimize: could rely on passed ID but need name)
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true }
        });

        // Send Email
        const { sendEmail } = require('@/infra/email/email.service');
        const { config } = require('@/config');
        const inviteLink = `${config.frontend.url}/accept-invite?token=${token}`;

        if (organization) {
            await sendEmail({
                to: invitation.email,
                subject: `Invitation to join ${organization.name}`,
                template: 'invite-user',
                data: {
                    inviteLink,
                    organizationName: organization.name,
                    role: invitation.role
                }
            });
        }

        return await prisma.invitation.findUnique({ where: { id: invitationId } }) as any; // Re-fetch or return object
    }

    static async cancelInvitation(invitationId: string, organizationId: string, userRole: Role) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        // Strict RBAC
        const { canManageRole } = require('@/utils/roleHierarchy');
        if (!canManageRole(userRole, invitation.role)) {
            throw new AppError('You cannot manage this invitation. You can only manage invitations for roles lower than yours.', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only cancel pending invitations', 400);
        }

        return await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'CANCELLED' },
        });
    }

    static async deleteInvitation(invitationId: string, organizationId: string, userRole: Role) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        // Strict RBAC
        const { canManageRole } = require('@/utils/roleHierarchy');
        if (!canManageRole(userRole, invitation.role)) {
            throw new AppError('You cannot manage this invitation. You can only manage invitations for roles lower than yours.', 403);
        }

        await prisma.invitation.delete({
            where: { id: invitationId },
        });
    }
}

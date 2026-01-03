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

        return await prisma.invitation.create({
            data: {
                organizationId,
                email: data.email,
                role: data.role,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });
    }

    static async getInvitations(
        organizationId: string,
        pagination: ParsedPagination,
        filters: GetInvitationsQuery
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

            return { user, employee };
        });
    }

    static async resendInvitation(organizationId: string, invitationId: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only resend pending invitations', 400);
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return await prisma.invitation.update({
            where: { id: invitationId },
            data: { token, expiresAt },
        });
    }

    static async cancelInvitation(organizationId: string, invitationId: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only cancel pending invitations', 400);
        }

        return await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'CANCELLED' },
        });
    }

    static async deleteInvitation(organizationId: string, invitationId: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        if (invitation.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        await prisma.invitation.delete({
            where: { id: invitationId },
        });
    }
}

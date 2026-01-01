import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
    CreateInvitationInput,
    InvitationFilters,
    PaginationParams,
} from './invitations.types';

export class InvitationService {
    /**
     * Create a new invitation
     */
    static async createInvitation(
        companyId: string,
        data: CreateInvitationInput
    ) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        // Check if there's already a pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                companyId,
                email: data.email,
                status: 'PENDING',
            },
        });

        if (existingInvitation) {
            throw new AppError('Invitation already sent to this email', 400);
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.invitation.create({
            data: {
                companyId,
                email: data.email,
                role: data.role,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });

        // TODO: Send invitation email with token
        // await sendInvitationEmail(data.email, token, companyId);

        return invitation;
    }

    /**
     * Get all invitations for a company
     */
    static async getInvitations(
        companyId: string,
        filters: InvitationFilters
    ) {
        const { page = 1, limit = 20, status, email } = filters;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            companyId,
        };

        if (status) {
            whereClause.status = status;
        }

        if (email) {
            whereClause.email = {
                contains: email,
                mode: 'insensitive',
            };
        }

        const [invitations, total] = await Promise.all([
            prisma.invitation.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { expiresAt: 'desc' },
            }),
            prisma.invitation.count({ where: whereClause }),
        ]);

        return {
            invitations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Verify invitation token and get details
     */
    static async verifyInvitationToken(token: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                company: {
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
            companyName: invitation.company.name,
            companyId: invitation.company.id,
            expiresAt: invitation.expiresAt,
        };
    }

    /**
     * Accept invitation and create user account
     */
    static async acceptInvitation(
        token: string,
        userData: {
            firstName: string;
            lastName: string;
            password: string;
        }
    ) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                company: true,
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

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email },
        });

        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user and employee in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: invitation.email,
                    password: hashedPassword,
                    role: invitation.role,
                    isEmailVerified: true, // Auto-verify since they accepted invitation
                },
            });

            // Create employee profile
            const employee = await tx.employee.create({
                data: {
                    companyId: invitation.companyId,
                    userId: user.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    status: 'ACTIVE',
                    joiningDate: new Date(),
                },
            });

            // Update invitation status
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: 'ACCEPTED' },
            });

            return { user, employee };
        });

        return result;
    }

    /**
     * Resend invitation
     */
    static async resendInvitation(invitationId: string, userCompanyId: string, userRole: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        // Validate company access
        if (userRole !== 'SUPER_ADMIN' && invitation.companyId !== userCompanyId) {
            throw new AppError('Access denied', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only resend pending invitations', 400);
        }

        // Generate new token and extend expiration
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const updatedInvitation = await prisma.invitation.update({
            where: { id: invitationId },
            data: {
                token,
                expiresAt,
            },
        });

        // TODO: Send new invitation email
        // await sendInvitationEmail(updatedInvitation.email, token, invitation.companyId);

        return updatedInvitation;
    }

    /**
     * Cancel invitation
     */
    static async cancelInvitation(invitationId: string, userCompanyId: string, userRole: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        // Validate company access
        if (userRole !== 'SUPER_ADMIN' && invitation.companyId !== userCompanyId) {
            throw new AppError('Access denied', 403);
        }

        if (invitation.status !== 'PENDING') {
            throw new AppError('Can only cancel pending invitations', 400);
        }

        const updatedInvitation = await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'CANCELLED' },
        });

        return updatedInvitation;
    }

    /**
     * Delete invitation
     */
    static async deleteInvitation(invitationId: string, userCompanyId: string, userRole: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new AppError('Invitation not found', 404);
        }

        // Validate company access
        if (userRole !== 'SUPER_ADMIN' && invitation.companyId !== userCompanyId) {
            throw new AppError('Access denied', 403);
        }

        await prisma.invitation.delete({
            where: { id: invitationId },
        });

        return { message: 'Invitation deleted successfully' };
    }
}

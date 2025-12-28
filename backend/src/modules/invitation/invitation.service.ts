import { PrismaClient, Invitation, User, Role } from '@prisma/client';
import crypto from 'crypto';
import { CreateInvitationDto, AcceptInvitationDto } from './invitation.types';
import { sendEmail } from '../notification/email.service';
import { EmailTemplate } from '../notification/notification.types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generate a random token
 */
function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new invitation
 */
export async function createInvitation(
    dto: CreateInvitationDto,
    inviterId: string
): Promise<Invitation> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Get inviter's company
    const inviter = await prisma.user.findUnique({
        where: { id: inviterId },
        include: { employee: true },
    });

    const inviterEmployee = inviter?.employee;

    if (!inviterEmployee?.companyId) {
        throw new Error('Inviter must belong to a company');
    }

    const companyId = inviterEmployee.companyId;

    // Check if invitation already exists (pending)
    const existingInvitation = await prisma.invitation.findFirst({
        where: {
            email: dto.email,
            companyId,
            status: 'PENDING',
        },
    });

    if (existingInvitation) {
        // Resend invitation? Or throw error?
        // Let's update the token and resend
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

        const updatedInvitation = await prisma.invitation.update({
            where: { id: existingInvitation.id },
            data: {
                token,
                expiresAt,
                role: dto.role, // Update role if changed
            },
        });

        // Send email
        await sendInvitationEmail(dto.email, token, companyId, dto.role);

        return updatedInvitation;
    }

    // Create new invitation
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const invitation = await prisma.invitation.create({
        data: {
            email: dto.email,
            role: dto.role,
            companyId,
            invitedBy: inviterId,
            token,
            expiresAt,
        },
    });

    // Send email
    await sendInvitationEmail(dto.email, token, companyId, dto.role);

    return invitation;
}

/**
 * Send invitation email
 */
async function sendInvitationEmail(email: string, token: string, companyId: string, role: Role) {
    // Get company name
    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    // Construct invite URL
    const inviteUrl = `${process.env.FRONTEND_URL}/join?token=${token}`;

    await sendEmail({
        to: email,
        subject: `You've been invited to join ${company?.name || 'QuixHR'}`,
        template: EmailTemplate.INVITATION,
        data: {
            companyName: company?.name,
            role,
            inviteUrl,
            expiresIn: '7 days'
        },
    });
}

/**
 * Validate invitation token
 */
export async function validateInvitationToken(token: string): Promise<Invitation | null> {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { company: true },
    });

    if (!invitation) return null;

    if (invitation.status !== 'PENDING') {
        throw new Error('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'EXPIRED' },
        });
        throw new Error('Invitation has expired');
    }

    return invitation;
}

/**
 * Accept invitation and create user
 */
export async function acceptInvitation(dto: AcceptInvitationDto): Promise<{ userId: string }> {
    const invitation = await validateInvitationToken(dto.token);

    if (!invitation) {
        throw new Error('Invalid invitation token');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
            data: {
                email: invitation.email,
                password: hashedPassword,
                role: invitation.role,
                emailVerified: true, // Auto-verify since they clicked the link
            },
        });

        // Create employee
        await tx.employee.create({
            data: {
                userId: user.id,
                companyId: invitation.companyId,
                name: dto.name,
                status: 'ACTIVE',
            },
        });

        // Update invitation status
        await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
        });

        return { user };
    });

    return { userId: result.user.id };
}

/**
 * Get all invitations for a company
 */
export async function getCompanyInvitations(companyId: string) {
    return prisma.invitation.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        include: {
            inviter: {
                select: {
                    email: true,
                    employee: { select: { name: true } }
                }
            }
        }
    });
}

/**
 * Resend invitation
 */
export async function resendInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) {
        throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
        throw new Error('Cannot resend non-pending invitation');
    }

    // Check if user has permission (same company)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true },
    });

    if (user?.employee?.companyId !== invitation.companyId) {
        throw new Error('Unauthorized');
    }

    // Update token and expiry
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.invitation.update({
        where: { id: invitation.id },
        data: { token, expiresAt },
    });

    // Send email
    await sendInvitationEmail(invitation.email, token, invitation.companyId, invitation.role);

    return { message: 'Invitation resent successfully' };
}

/**
 * Delete invitation
 */
export async function deleteInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) {
        throw new Error('Invitation not found');
    }

    // Check if user has permission (same company)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true },
    });

    if (user?.employee?.companyId !== invitation.companyId) {
        throw new Error('Unauthorized');
    }

    await prisma.invitation.delete({
        where: { id: invitationId },
    });

    return { message: 'Invitation deleted successfully' };
}

import prisma from './prisma';
import crypto from 'crypto';
import { emailService } from './emailService';
import { Role } from '@prisma/client';
import { config } from '../config';

export const inviteService = {
    async createInvite(email: string, role: Role, organizationId: string | number) {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        const orgIdStr = String(organizationId);

        if (existingUser) {
            // Check if already in this organization
            if (existingUser.organizationId === orgIdStr) {
                throw new Error('User is already a member of this organization');
            }
            // If in another organization, maybe handle multi-tenancy later, 
            // but for now, we can just error or allow sending invite to switch?
            // Let's standard on error if user exists for now to keep it simple, 
            // OR we can send a link that just adds them to org.
            // Requirement says "send them an invite with the link".
            // Let's assume standard flow: generate token.
        }

        // 2. Check if invite already exists
        const existingInvite = await prisma.invite.findUnique({
            where: {
                email_organizationId: {
                    email,
                    organizationId: orgIdStr
                }
            }
        });

        if (existingInvite) {
            // Update token and expiresAt
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            const updatedInvite = await prisma.invite.update({
                where: { id: existingInvite.id },
                data: {
                    token,
                    role,
                    expiresAt
                }
            });

            emailService.sendInviteEmail(email, token, role)
                .catch(err => console.error('Failed to send invite email:', err));
            return updatedInvite;
        }

        // 3. Create new invite
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const newInvite = await prisma.invite.create({
            data: {
                email,
                role,
                organizationId: orgIdStr,
                token,
                expiresAt
            }
        });

        emailService.sendInviteEmail(email, token, role)
            .catch(err => console.error('Failed to send invite email:', err));
        return newInvite;
    },

    async validateInvite(token: string) {
        const invite = await prisma.invite.findUnique({
            where: { token },
            include: { organization: true }
        });

        if (!invite) {
            throw new Error('Invalid invitation link');
        }

        // If strict expiry check is needed, do it here.
        // But if accepted, we might want to return it even if expired? 
        // No, typically if accepted, the flow is done. 
        // But for race condition check, if acceptedAt is set, we return it.

        if (!invite.acceptedAt && invite.expiresAt < new Date()) {
            throw new Error('Invitation expired');
        }

        return invite;
    },

    async acceptInvite(token: string, userId: string | number) {
        const invite = await this.validateInvite(token);

        if (invite.acceptedAt) {
            throw new Error("Invitation already accepted");
        }

        // Update user
        await prisma.user.update({
            where: { id: String(userId) },
            data: {
                organizationId: invite.organizationId,
                role: invite.role
            }
        });

        // Mark invite as accepted instead of delete
        await prisma.invite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() }
        });

        return invite.organization;
    }
};

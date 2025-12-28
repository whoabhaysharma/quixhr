import { Request, Response } from 'express';
import { z } from 'zod';
import * as invitationService from './invitation.service';
import { createInvitationSchema, acceptInvitationSchema } from './invitation.types';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

/**
 * Create a new invitation
 */
export async function create(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ success: false, error: 'User not authenticated' });
            return;
        }

        const dto = createInvitationSchema.parse(req.body);
        const invitation = await invitationService.createInvitation(dto, req.user.id);

        res.status(201).json({ success: true, data: invitation });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to create invitation' });
    }
}

/**
 * Validate invitation token
 */
export async function validate(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, error: 'Token is required' });
            return;
        }

        const invitation = await invitationService.validateInvitationToken(token);
        if (!invitation) {
            res.status(404).json({ success: false, error: 'Invalid invitation token' });
            return;
        }

        res.json({ success: true, data: invitation });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to validate invitation' });
    }
}

/**
 * Accept invitation and create user
 */
export async function accept(req: Request, res: Response): Promise<void> {
    try {
        const dto = acceptInvitationSchema.parse(req.body);
        const result = await invitationService.acceptInvitation(dto);

        res.status(201).json({ success: true, message: 'Invitation accepted successfully', userId: result.userId });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to accept invitation' });
    }
}

/**
 * Get all invitations for the current user's company
 */
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.companyId) {
            res.status(401).json({ success: false, error: 'User not authenticated or not in a company' });
            return;
        }

        const invitations = await invitationService.getCompanyInvitations(req.user.companyId);
        res.json({ success: true, data: invitations });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch invitations' });
    }
}

/**
 * Resend invitation
 */
export async function resend(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ success: false, error: 'User not authenticated' });
            return;
        }

        const { id } = req.params;
        await invitationService.resendInvitation(id, req.user.id);

        res.json({ success: true, message: 'Invitation resent successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to resend invitation' });
    }
}

/**
 * Delete invitation
 */
export async function deleteOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ success: false, error: 'User not authenticated' });
            return;
        }

        const { id } = req.params;

        // Security check: Ensure user belongs to same company as invitation
        // (Service doesn't do this check yet, we should check here or in service)
        // I'll check here for consistency with other controllers.

        // Actually, let's fetch invitation to check permissions
        // But the service delete function fetches it too.
        // Optimally, service handles permission or we fetch first.

        // Quick permission check via DB
        // ... Or rely on service throwing if not found? 
        // But if found, we must ensure company match.

        // Let's modify service to take userId and do check, OR do it here.
        // I'll do it here to keep service simple for now, echoing resend pattern.
        // Wait, resend pattern in service DOES check permission (lines 232-240).
        // My new deleteInvitation service function DOES NOT check permission.

        // I should have added permission check to service. 
        // But for now, I'll add it to controller to be safe.
        // Or better, just like `resend`, I should pass userId to service?

        // Re-reading service (Step 525): `resendInvitation` takes `userId`.
        // My `deleteInvitation` only took `invitationId`.

        // I will implement permission check in controller for now by getting invitation first via service validation? No, service `validateInvitationToken` is for token.
        // I'll just rely on `deleteInvitation` deleting it. 
        // SECURITY RISK: If I don't check company, any HR Admin could delete ANY invitation if they guess ID.
        // UUIDs are hard to guess, but still.

        // I will add a check in controller.
        // But I can't easily access prisma here without importing it.
        // `invitationService` exports `getCompanyInvitations` but not `getOne`.
        // I'll create `deleteInvitation` in controller that just calls service, 
        // BUT I really should handle security.

        // Ideally I should have updated service to accept userId.
        // Given I already wrote the service, I'll update the service again? 
        // Or I can just check it in controller using a new service method `getInvitationById`?

        // Let's UPDATE the service to be secure.

        await invitationService.deleteInvitation(id, req.user.id);
        res.json({ success: true, message: 'Invitation deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to delete invitation' });
    }
}

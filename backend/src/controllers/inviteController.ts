import { Request, Response } from 'express';
import { inviteService } from '../services/inviteService';
import { Role } from '@prisma/client';

export const sendInvite = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;
        // Assume req.user is set by auth middleware
        const organizationId = (req as any).user.organizationId;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID missing from requester' });
        }

        const invite = await inviteService.createInvite(email, role || Role.EMPLOYEE, organizationId);
        res.status(201).json({ message: 'Invitation sent successfully', data: invite });
    } catch (error: any) {
        console.error('Send Invite Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const validateInvite = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const invite = await inviteService.validateInvite(token);
        res.status(200).json({ message: 'Valid token', data: invite });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const acceptInvite = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        // User must be logged in to accept? Or this registers them?
        // If user is logged in, we link them.
        // If user is NOT logged in, we probably shouldn't be calling this yet? 
        // Or this endpoint creates the user too?
        // Scenario: User clicks link -> Redirects to UI -> UI sees token -> 
        // If user logged in: UI calls POST /invites/:token/accept
        // If user NOT logged in: UI shows Register Form (prefilled email) -> POST /auth/register-from-invite?

        // Wait, the plan was:
        // "Accept Invite (New User): Open Incognito -> Click Link -> Register -> Verify added"
        // "Accept Invite (Existing User): Log in -> Click Link -> Join -> Verify added"

        // So we need distinct flows.
        // For existing user: `acceptInvite` uses `req.user.id`.
        // For new user: `authController.registerWithInvite`?

        // Let's implement `acceptInvite` for logged-in users here.
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User must be logged in to accept invite' });
        }

        const organization = await inviteService.acceptInvite(token, userId);
        res.status(200).json({ message: 'Joined organization successfully', data: organization });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { Role } from '@prisma/client';

class MemberController {
    // GET /api/v1/members
    async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(400).json({ success: false, error: { message: 'Organization Context missing' } });
                return;
            }

            const users = await userService.getAllUsers(organizationId);
            res.json({ success: true, data: { users } });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/members
    async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, email, role } = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(400).json({ success: false, error: { message: 'Organization Context missing' } });
                return;
            }

            if (!email || !name || !role) {
                res.status(400).json({ success: false, error: { message: 'Name, Email and Role are required' } });
                return;
            }

            // Hardcoded temp password for MVP
            const tempPassword = 'password123';

            const newUser = await userService.createUser({
                name,
                email,
                password: tempPassword,
                organizationId,
                role: role as Role,
                // googleLoginId: undefined, // Not a google user initially
            });

            // TODO: Send invite email here

            res.status(201).json({
                success: true,
                data: { user: newUser },
                message: 'Member added successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const memberController = new MemberController();

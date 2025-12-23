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
            res.json({ success: true, data: { members: users } });
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

    // PATCH /api/v1/members/:id
    async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(400).json({ success: false, error: { message: 'Organization Context missing' } });
                return;
            }

            if (!role) {
                res.status(400).json({ success: false, error: { message: 'Role is required' } });
                return;
            }

            // Verify the user belongs to the same organization
            const user = await userService.getUserById(id);
            if (!user || user.organizationId !== organizationId) {
                res.status(404).json({ success: false, error: { message: 'Member not found' } });
                return;
            }

            // Prevent demoting the last admin
            if (user.role === Role.ADMIN && role !== Role.ADMIN) {
                const admins = (await userService.getAllUsers(organizationId)).filter(u => u.role === Role.ADMIN);
                if (admins.length <= 1) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Cannot demote the last administrator. Please assign another admin first.' }
                    });
                    return;
                }
            }

            const updatedUser = await userService.updateUser(id, { role: role as Role });

            res.json({
                success: true,
                data: { member: updatedUser },
                message: 'Member role updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/v1/members/:id
    async deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(400).json({ success: false, error: { message: 'Organization Context missing' } });
                return;
            }

            // Verify the user belongs to the same organization
            const user = await userService.getUserById(id);
            if (!user || user.organizationId !== organizationId) {
                res.status(404).json({ success: false, error: { message: 'Member not found' } });
                return;
            }

            // Prevent deleting yourself
            if (user.id === req.user?.id) {
                res.status(400).json({ success: false, error: { message: 'Cannot delete your own account' } });
                return;
            }

            // Prevent deleting the last admin
            if (user.role === Role.ADMIN) {
                const admins = (await userService.getAllUsers(organizationId)).filter(u => u.role === Role.ADMIN);
                if (admins.length <= 1) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Cannot delete the last administrator. Please assign another admin first.' }
                    });
                    return;
                }
            }

            await userService.deleteUser(id);

            res.json({
                success: true,
                message: 'Member deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const memberController = new MemberController();

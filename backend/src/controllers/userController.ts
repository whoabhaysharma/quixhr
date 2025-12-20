import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { Role } from '@prisma/client';
import { ROLES, ROLE_VALUES } from '../constants';
const userService = new UserService();

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        // If for some reason orgId is missing (e.g. super admin not belonging to org?), handle gracefully or throw
        // For now assuming all users should have orgId except maybe super admin.
        // But even super admin might want to see users of a specific org, passed as query param in that case.
        // Sticking to "current user's org" for now as per requirement.
        res.status(400).json({ message: 'Organization context required' });
        return;
      }
      const users = await userService.getAllUsers(req.user.organizationId);
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(parseInt(id));

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Check if user belongs to the same organization
      if (req.user?.role !== ROLES.ADMIN && user.organizationId !== req.user?.organizationId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUsersByRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      if (!ROLE_VALUES.includes(role as Role)) {
        res.status(400).json({ message: 'Invalid role' });
        return;
      }

      if (!req.user?.organizationId) {
        res.status(400).json({ message: 'Organization context required' });
        return;
      }

      const users = await userService.getUsersByRole(role as Role, req.user.organizationId);
      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // Users can only update their own profile, except admins
      if (userId !== parseInt(id) && req.user?.role !== ROLES.ADMIN) {
        res.status(403).json({ message: 'You can only update your own profile' });
        return;
      }

      const user = await userService.updateUser(parseInt(id), req.body);
      res.status(200).json({
        message: 'User updated successfully',
        user,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // Users can only delete their own account, except admins
      if (userId !== parseInt(id) && req.user?.role !== ROLES.ADMIN) {
        res.status(403).json({ message: 'You can only delete your own account' });
        return;
      }

      await userService.deleteUser(parseInt(id));
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const userController = new UserController();

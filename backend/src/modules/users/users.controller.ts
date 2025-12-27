import { Request, Response, NextFunction } from 'express';
import { userService } from '../users/users.service';
import { Role } from '@prisma/client';

class UserController {
  // GET /api/v1/users
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.query.organizationId ? Number(req.query.organizationId) : undefined;
      const users = await userService.getAllUsers(organizationId);
      res.json({
        success: true,
        data: {
          users,
          total: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/users/:id
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = await userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/users
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, organizationId, role, googleLoginId, avatar } = req.body;

      if (!email || !organizationId) {
        res.status(400).json({
          success: false,
          error: { message: 'Email and organizationId are required' },
        });
        return;
      }

      const newUser = await userService.createUser({
        name,
        email,
        password,
        organizationId: Number(organizationId),
        role,
        googleLoginId,
        avatar,
      });

      res.status(201).json({
        success: true,
        data: { user: newUser },
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/users/:id
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      // Authorization check: Employees can only update their own profile
      if (req.user?.role === Role.EMPLOYEE && req.user.id !== id) {
        res.status(403).json({ success: false, error: { message: 'Forbidden: Cannot update other users profile' } });
        return;
      }

      const data = req.body;

      const updatedUser = await userService.updateUser(id, data);

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/users/:id
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await userService.deleteUser(id);

      res.json({
        success: true,
        message: `User ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
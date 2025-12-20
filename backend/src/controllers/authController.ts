import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
const authService = new AuthService();
const userService = new UserService();

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, name, password, organizationName } = req.body;
      const result = await authService.register(email, name, password, organizationName);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async verifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ message: 'Invalid token' });
        return;
      }
      const result = await authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await userService.getUserById(userId);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const authController = new AuthController();

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { userService } from '../users/users.service';

class AuthController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
                return;
            }

            const result = await authService.login(email, password);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
        }
    }

    async sendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, error: { message: 'Email is required' } });
                return;
            }
            const result = await authService.sendVerificationOtp(email);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Failed to send verification code' } });
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, email, password, otp, organizationName } = req.body;

            if (!email || !password || !name || !otp || !organizationName) {
                res.status(400).json({ success: false, error: { message: 'Name, email, password, organization name, and verification code are required' } });
                return;
            }

            const result = await authService.registerWithEmail(email, password, name, otp, organizationName);
            res.json({ success: true, data: result });

        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Registration failed' } });
        }
    }

    async registerWithInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, name, password } = req.body;

            if (!token || !name || !password) {
                res.status(400).json({ success: false, error: { message: 'Token, name, and password are required' } });
                return;
            }

            const result = await authService.registerWithInvite(token, name, password);
            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Failed to register with invite' } });
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(400).json({ success: false, error: { message: 'Email is required' } });
                return;
            }

            const result = await authService.forgotPassword(email);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Failed to generate reset link' } });
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                res.status(400).json({ success: false, error: { message: 'Token and new password are required' } });
                return;
            }

            const result = await authService.resetPassword(token, newPassword);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Failed to reset password' } });
        }
    }

    async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
                return;
            }

            const user = await userService.getUserById(userId);
            if (!user) {
                res.status(404).json({ success: false, error: { message: 'User not found' } });
                return;
            }

            const { password: _, ...userWithoutPassword } = user;
            res.json({ success: true, data: userWithoutPassword });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { message: error.message || 'Failed to fetch user' } });
        }
    }
}

export const authController = new AuthController();

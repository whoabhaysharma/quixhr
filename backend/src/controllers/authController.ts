import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

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

    async firebaseLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                res.status(400).json({ success: false, error: { message: 'ID Token is required' } });
                return;
            }

            const result = await authService.loginWithFirebase(idToken);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(401).json({ success: false, error: { message: error.message || 'Invalid Firebase Token' } });
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idToken, name, email, password } = req.body;

            if (idToken) {
                const result = await authService.registerWithFirebase(idToken, name);
                res.json({ success: true, data: result });
                return;
            }

            if (email && password) {
                const result = await authService.registerWithEmail(email, password, name);
                res.json({ success: true, data: result });
                return;
            }

            res.status(400).json({ success: false, error: { message: 'Either ID Token or Email/Password is required' } });

        } catch (error: any) {
            res.status(400).json({ success: false, error: { message: error.message || 'Registration failed' } });
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
}

export const authController = new AuthController();

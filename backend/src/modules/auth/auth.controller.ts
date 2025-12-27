import { Request, Response } from 'express';
import { authService } from './auth.service';
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from './auth.types';
import { AuthRequest } from '../../shared/middleware';

/**
 * POST /auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        // Validate request body
        const dto = loginSchema.parse(req.body);

        // Get IP address
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

        // Login
        const result = await authService.login(dto, ipAddress);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Login failed',
        });
    }
}

/**
 * POST /auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        // Validate request body
        const dto = registerSchema.parse(req.body);

        // Register
        const result = await authService.register(dto);

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Registration failed',
        });
    }
}

/**
 * POST /auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    try {
        // Validate request body
        const dto = forgotPasswordSchema.parse(req.body);

        // Generate reset token
        const result = await authService.forgotPassword(dto);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to process request',
        });
    }
}

/**
 * POST /auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
    try {
        // Validate request body
        const dto = resetPasswordSchema.parse(req.body);

        // Reset password
        const result = await authService.resetPassword(dto);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Password reset failed',
        });
    }
}

/**
 * GET /auth/me
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        const user = await authService.getCurrentUser(req.user.id);

        res.json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to fetch user',
        });
    }
}

/**
 * GET /auth/verify-email/:token
 */
export async function verifyEmailController(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.params;

        if (!token) {
            res.status(400).json({
                success: false,
                error: 'Verification token is required',
            });
            return;
        }

        const result = await authService.verifyEmail(token);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Email verification failed',
        });
    }
}

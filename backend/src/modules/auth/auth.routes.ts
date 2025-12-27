import { Router } from 'express';
import { login, register, forgotPassword, resetPassword, getCurrentUser, verifyEmailController } from './auth.controller';
import { authMiddleware, authRateLimit } from '../../shared/middleware';

const router = Router();

// Public routes - with strict rate limiting for auth endpoints
router.post('/login', authRateLimit, login);
router.post('/register', authRateLimit, register);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.get('/verify-email/:token', verifyEmailController);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export default router;
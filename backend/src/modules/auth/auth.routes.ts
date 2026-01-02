import { Router } from 'express';
import * as AuthController from './auth.controller';
import { protect, validate } from '@/shared/middleware';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    changePasswordSchema,
} from './auth.schema';

const router = Router();

// =========================================================================
// PUBLIC AUTHENTICATION ROUTES
// =========================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Onboard a new Company + Super Admin + Subscription
 * @access  Public
 */
router.post(
    '/register',
    validate(registerSchema),
    AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return Access/Refresh Tokens
 * @access  Public
 */
router.post(
    '/login',
    validate(loginSchema),
    AuthController.login
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get a new Access Token using a valid Refresh Token
 * @access  Public (Validates Refresh Token inside controller)
 */
router.post(
    '/refresh-token',
    AuthController.refreshToken
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Trigger email with password reset link
 * @access  Public
 */
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    AuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Set new password using the token received in email
 * @access  Public
 */
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    AuthController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address using token
 * @access  Public
 * @body    {
 *   token: string
 * }
 */
router.post(
    '/verify-email',
    validate(verifyEmailSchema),
    AuthController.verifyEmail
);

// =========================================================================
// PROTECTED AUTH ROUTES
// =========================================================================

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidate Refresh Token / Clear Cookies
 * @access  Protected
 */
router.post(
    '/logout',
    protect,
    AuthController.logout
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password (authenticated user only)
 * @access  Protected
 * @body    {
 *   currentPassword: string,
 *   newPassword: string,
 *   confirmPassword: string
 * }
 */
router.post(
    '/change-password',
    protect,
    validate(changePasswordSchema),
    AuthController.changePassword
);

export default router;

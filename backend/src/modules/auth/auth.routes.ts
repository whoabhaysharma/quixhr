import { Router } from 'express';
import * as AuthController from './auth.controller';
import * as AuthSchema from './auth.schema';
import * as AuthMiddleware from './auth.middleware';
import validate from '@/shared/middleware/validateResource';

const router = Router();

/**
 * @description  User Registration (Company + Admin User)
 * @access       Public
 */
router.post(
    '/register',
    validate(AuthSchema.registerSchema),
    AuthController.register
);

/**
 * @description  Standard Login
 * @access       Public
 */
router.post(
    '/login',
    validate(AuthSchema.loginSchema),
    AuthController.login
);

/**
 * @description  Accept Invitation (Employee)
 * @access       Public (Token is in body)
 */
router.post(
    '/accept-invitation',
    validate(AuthSchema.acceptInvitationSchema),
    AuthController.acceptInvitation
);

/**
 * @description  Forgot Password (Sends reset link via email)
 * @access       Public
 */
router.post(
    '/forgot-password',
    validate(AuthSchema.forgotPasswordSchema),
    AuthController.forgotPassword
);

/**
 * @description  Reset Password (Verifies token and sets new password)
 * @access       Public
 */
router.post(
    '/reset-password',
    validate(AuthSchema.resetPasswordSchema),
    AuthController.resetPassword
);

/**
 * @description  Get Current User Profile
 * @access       Private (Requires valid JWT)
 */
router.get(
    '/me',
    AuthMiddleware.protect,
    AuthController.getMe
);

/**
 * @description  Update Password (While logged in)
 * @access       Private
 */
router.patch(
    '/update-password',
    AuthMiddleware.protect,
    validate(AuthSchema.updatePasswordSchema),
    AuthController.updatePassword
);

export default router;
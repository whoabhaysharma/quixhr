import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo, validate } from '@/shared/middleware';
import * as UserController from './users.controller';
import { getUsersQuerySchema, userIdSchema } from './users.schema';

const router = Router();

// Global Middleware
router.use(protect);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Super Admin only)
 * @access  SUPER_ADMIN
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN),
    validate(getUsersQuerySchema),
    UserController.getUsers
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID (Super Admin only)
 * @access  SUPER_ADMIN
 */
router.get(
    '/:userId',
    restrictTo(Role.SUPER_ADMIN),
    validate(userIdSchema),
    UserController.getUserById
);

export default router;

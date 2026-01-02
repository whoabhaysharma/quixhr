import express from 'express';
import * as UserController from './users.controller';
import { protect, restrictTo } from '@/shared/middleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);

router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN),
    UserController.getUsers
);

export default router;

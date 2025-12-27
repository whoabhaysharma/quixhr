import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.HR), userController.getAllUsers);
router.get('/:id', authorize(Role.ADMIN, Role.HR, Role.EMPLOYEE), userController.getUserById);
router.post('/', authorize(Role.ADMIN, Role.HR), userController.createUser);
router.put('/:id', authorize(Role.ADMIN, Role.HR, Role.EMPLOYEE), userController.updateUser); // Controller should ensure Employee only updates own profile
router.delete('/:id', authorize(Role.ADMIN, Role.HR), userController.deleteUser);

export default router;
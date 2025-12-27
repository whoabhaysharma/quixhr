import { Router } from 'express';
import { memberController } from './member.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List members - Accessible by Admin, HR, Employee (to see colleagues? maybe just Admin/HR for now)
router.get('/', authorize(Role.ADMIN, Role.HR), memberController.getMembers);

// Add member - Accessible by Admin, HR
router.post('/', authorize(Role.ADMIN, Role.HR), memberController.addMember);

// Update member role - Accessible by Admin, HR
router.patch('/:id', authorize(Role.ADMIN, Role.HR), memberController.updateMemberRole);

// Delete member - Accessible by Admin, HR
router.delete('/:id', authorize(Role.ADMIN, Role.HR), memberController.deleteMember);

export default router;

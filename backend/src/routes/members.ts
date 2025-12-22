import { Router } from 'express';
import { memberController } from '../controllers/memberController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List members - Accessible by Admin, HR, Employee (to see colleagues? maybe just Admin/HR for now)
router.get('/', authorize(Role.ADMIN, Role.HR), memberController.getMembers);

// Add member - Accessible by Admin, HR
router.post('/', authorize(Role.ADMIN, Role.HR), memberController.addMember);

export default router;

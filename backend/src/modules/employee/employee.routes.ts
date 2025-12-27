import { Router } from 'express';
import * as employeeController from './employee.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Create employee (HR Only)
router.post('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), employeeController.create);

// Get all employees (HR & Manager)
router.get('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER), employeeController.getAll);

// Assign calendar to employee (HR Only)
router.post('/:id/calendar', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), employeeController.assignCalendar);

// Get single employee (All authenticated - controller handles specific permission)
router.get('/:id', employeeController.getOne);

// Update employee (HR Only)
router.patch('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), employeeController.update);

// Delete employee (HR Only)
router.delete('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), employeeController.deleteOne);

export default router;

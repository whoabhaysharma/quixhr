import { Router } from 'express';
import * as calendarController from './calendar.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Create calendar (HR Only)
router.post('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.create);

// Get all calendars (HR & Manager)
router.get('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER), calendarController.getAll);

// Get single calendar (All authenticated - controller handles specific permission)
// Employees might need to see their own calendar, controller already restricts logic if needed
router.get('/:id', calendarController.getOne);

// Update calendar (HR Only)
router.patch('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.update);

// Update single weekly rule (HR Only)
router.put('/:id/rules', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.updateWeeklyRule);

// Add holiday (HR Only)
router.post('/:id/holidays', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.addHoliday);

// Get holidays (Authenticated)
router.get('/:id/holidays', calendarController.getHolidays);

// Delete holiday (HR Only)
router.delete('/:id/holidays/:holidayId', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.deleteHoliday);

// Delete calendar (HR Only)
router.delete('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), calendarController.deleteOne);

export default router;

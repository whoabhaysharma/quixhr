import { Router } from 'express';
import { HolidayCalendarController } from './holiday-calendars.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Calendar routes
router.post('/', HolidayCalendarController.createCalendar);
router.get('/', HolidayCalendarController.getAllCalendars);
router.get('/:id', HolidayCalendarController.getCalendarById);
router.put('/:id', HolidayCalendarController.updateCalendar);
router.delete('/:id', HolidayCalendarController.deleteCalendar);
router.post('/:id/assign', HolidayCalendarController.assignCalendarToUsers);

export default router;

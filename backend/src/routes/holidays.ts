import { Router } from 'express';
import { HolidayController } from '../controllers/holidayController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Holiday routes
router.post('/', HolidayController.createHoliday);
router.get('/calendar/:calendarId', HolidayController.getHolidaysByCalendar);
router.get('/upcoming', HolidayController.getUpcomingHolidays);
router.put('/:id', HolidayController.updateHoliday);
router.delete('/:id', HolidayController.deleteHoliday);
router.post('/bulk', HolidayController.bulkCreateHolidays);

export default router;

import { Router } from 'express';
import { leaveController } from '../controllers/leaveController';
import { authenticateToken, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { ROLES } from '../constants';

const router = Router();

const createLeaveSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().optional(),
});

const updateLeaveSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  reason: Joi.string().optional(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED', 'CANCELLED').required(),
  adminNotes: Joi.string().optional(),
});

router.use(authenticateToken);

// Employee routes
router.post('/', validate(createLeaveSchema), (req, res) =>
  leaveController.createLeave(req, res)
);
router.get('/user/stats', (req, res) => leaveController.getLeaveStats(req, res));
router.get('/user/leaves', (req, res) => leaveController.getUserLeaves(req, res));
router.get('/approved', (req, res) => leaveController.getApprovedLeaves(req, res));
router.get('/rejected', (req, res) => leaveController.getRejectedLeaves(req, res));
router.get('/:id', (req, res) => leaveController.getLeaveById(req, res));
router.put('/:id', validate(updateLeaveSchema), (req, res) =>
  leaveController.updateLeave(req, res)
);
router.put('/:id/cancel', (req, res) => leaveController.cancelLeave(req, res));
router.delete('/:id', (req, res) => leaveController.deleteLeave(req, res));

// Admin/HR routes
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), (req, res) =>
  leaveController.getAllLeaves(req, res)
);
router.get('/pending', authorize(ROLES.ADMIN, ROLES.HR), (req, res) =>
  leaveController.getPendingLeaves(req, res)
);
router.put('/:id/approve', authorize(ROLES.ADMIN, ROLES.HR), (req, res) =>
  leaveController.approveLeave(req, res)
);
router.put('/:id/reject', authorize(ROLES.ADMIN, ROLES.HR), (req, res) =>
  leaveController.rejectLeave(req, res)
);
router.put('/:id/status', authorize(ROLES.ADMIN, ROLES.HR), validate(updateStatusSchema), (req, res) =>
  leaveController.updateLeaveStatus(req, res)
);

export default router;

import { Router } from 'express';
import { approvalController } from '../controllers/approvalController';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/:leaveId', (req, res) => approvalController.createApproval(req, res));
router.get('/:id', (req, res) => approvalController.getApprovalById(req, res));
router.get('/leaves/:leaveId', (req, res) => approvalController.getLeaveApprovals(req, res));
router.put('/:id', (req, res) => approvalController.updateApprovalStatus(req, res));
router.get('/pending', (req, res) => approvalController.getPendingApprovals(req, res));

export default router;

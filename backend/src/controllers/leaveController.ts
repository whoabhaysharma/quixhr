import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LeaveService } from '../services/leaveService';
import { LeaveStatus } from '@prisma/client';
const leaveService = new LeaveService();

export class LeaveController {
  async createLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { startDate, endDate, reason } = req.body;
      const leave = await leaveService.createLeave(
        userId,
        new Date(startDate),
        new Date(endDate),
        reason
      );
      res.status(201).json({
        message: 'Leave request created successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getLeaveById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.getLeaveById(parseInt(id));

      if (!leave) {
        res.status(404).json({ message: 'Leave not found' });
        return;
      }

      res.status(200).json(leave);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUserLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { status } = req.query;
      const leaves = await leaveService.getLeavesByUserId(
        userId,
        status as LeaveStatus | undefined
      );
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(400).json({ message: 'Organization context required' });
        return;
      }

      const { status } = req.query;
      const leaves = await leaveService.getAllLeaves(
        req.user.organizationId,
        status as LeaveStatus | undefined
      );
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getPendingLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(400).json({ message: 'Organization context required' });
        return;
      }

      const leaves = await leaveService.getPendingLeaves(req.user.organizationId);
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getApprovedLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const leaves = await leaveService.getApprovedLeaves(userId);
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getRejectedLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const leaves = await leaveService.getRejectedLeaves(userId);
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const leave = await leaveService.updateLeave(
        parseInt(id),
        userId,
        req.body
      );
      res.status(200).json({
        message: 'Leave updated successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateLeaveStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const leave = await leaveService.updateLeaveStatus(
        parseInt(id),
        status,
        adminNotes
      );
      res.status(200).json({
        message: 'Leave status updated successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async approveLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const leave = await leaveService.approveLeave(parseInt(id), adminNotes);
      res.status(200).json({
        message: 'Leave approved successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async rejectLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const leave = await leaveService.rejectLeave(parseInt(id), adminNotes);
      res.status(200).json({
        message: 'Leave rejected successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async cancelLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const leave = await leaveService.cancelLeave(parseInt(id), userId);
      res.status(200).json({
        message: 'Leave cancelled successfully',
        leave,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteLeave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await leaveService.deleteLeave(parseInt(id), userId);
      res.status(200).json({ message: 'Leave deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getLeaveStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const stats = await leaveService.getLeaveStats(userId);
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const leaveController = new LeaveController();

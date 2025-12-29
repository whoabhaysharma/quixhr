import { Request, Response } from 'express';
import * as LeaveService from './leave.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    Get leave balances
 * @route   GET /api/v1/leaves/my-balances
 * @access  Employee
 */
export const getMyBalances = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;

    const balances = await LeaveService.getMyBalances(userId);

    sendResponse(res, 200, { balances }, 'Leave balances retrieved successfully');
});

/**
 * @desc    Apply for leave
 * @route   POST /api/v1/leaves/apply
 * @access  Employee
 */
export const applyLeave = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;

    const leaveRequest = await LeaveService.applyLeave(userId, req.body);

    sendResponse(res, 201, { leaveRequest }, 'Leave request submitted successfully');
});

/**
 * @desc    List leave requests
 * @route   GET /api/v1/leaves/requests
 * @access  All (filtered by role)
 */
export const listRequests = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const userRole = req.user?.role!;
    const companyId = req.targetCompanyId;
    const filters = req.query;

    const requests = await LeaveService.listRequests(userId, userRole, companyId, filters);

    sendResponse(res, 200, { requests, count: requests.length }, 'Leave requests retrieved successfully');
});

/**
 * @desc    Approve or reject leave request
 * @route   PATCH /api/v1/leaves/requests/:id
 * @access  Manager
 */
export const approveRejectRequest = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const leaveRequest = await LeaveService.approveRejectRequest(id, companyId, req.body);

    const message = req.body.status === 'APPROVED'
        ? 'Leave request approved successfully'
        : 'Leave request rejected successfully';

    sendResponse(res, 200, { leaveRequest }, message);
});

/**
 * @desc    Cancel leave request
 * @route   PATCH /api/v1/leaves/requests/:id/cancel
 * @access  Employee
 */
export const cancelRequest = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const { id } = req.params;

    const leaveRequest = await LeaveService.cancelRequest(id, userId);

    sendResponse(res, 200, { leaveRequest }, 'Leave request cancelled successfully');
});

/**
 * @desc    Get leave ledger (audit trail)
 * @route   GET /api/v1/leaves/ledger/:employeeId
 * @access  HR/User
 */
export const getLeaveLedger = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { employeeId } = req.params;
    const leaveType = req.query.leaveType as string | undefined;

    const ledger = await LeaveService.getLeaveLedger(employeeId, companyId, leaveType as any);

    sendResponse(res, 200, ledger, 'Leave ledger retrieved successfully');
});

/**
 * @desc    Manual leave adjustment
 * @route   POST /api/v1/leaves/adjust
 * @access  HR Admin
 */
export const adjustLeave = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const ledgerEntry = await LeaveService.adjustLeave(companyId, req.body);

    sendResponse(res, 200, { ledgerEntry }, 'Leave adjustment completed successfully');
});

/**
 * @desc    Bulk import leave balances
 * @route   POST /api/v1/leaves/import
 * @access  HR Admin
 */
export const importLeaves = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const results = await LeaveService.importLeaves(companyId, req.body);

    sendResponse(
        res,
        200,
        results,
        `Import completed. Success: ${results.success.length}, Failed: ${results.failed.length}`
    );
});

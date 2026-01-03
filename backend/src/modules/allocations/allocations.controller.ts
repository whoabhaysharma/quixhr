import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { LeaveAllocationService } from './allocations.service';
import {
    LeaveAllocationsListResponseDto,
    LeaveAllocationResponseDto,
    BulkAllocationResponseDto,
} from './allocations.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request) => {
    const user = (req as any).user;
    if (!user) {
        throw new AppError('User not authenticated', 401);
    }
    return user;
};

// =========================================================================
// FLAT ALLOCATION ENDPOINTS
// =========================================================================

export const getAllocations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        if (!organizationId) {
            return next(new AppError('Organization context is required', 400));
        }

        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const leaveType = req.query.leaveType as any;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await LeaveAllocationService.getAllocations(organizationId, {
            year,
            leaveType,
            page,
            limit
        });

        sendResponse(res, 200, {
            success: true,
            message: 'Allocations retrieved successfully',
            data: result,
        });
    }
);

/**
 * @desc    Get allocation by ID
 * @route   GET /api/v1/allocations/:allocationId
 * @access  Protected (HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN)
 */
export const getAllocationById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const { allocationId } = req.params;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        const allocation = await LeaveAllocationService.getAllocationById(
            allocationId,
            organizationId,
            authContext.role
        );

        const responseData = {
            success: true,
            message: 'Allocation retrieved successfully',
            data: allocation,
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Update allocation
 * @route   PATCH /api/v1/allocations/:allocationId
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const updateAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const { allocationId } = req.params;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        const allocation = await LeaveAllocationService.updateAllocation(
            allocationId,
            req.body,
            organizationId,
            authContext.role
        );

        const responseData = {
            success: true,
            message: 'Allocation updated successfully',
            data: allocation,
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Delete allocation
 * @route   DELETE /api/v1/allocations/:allocationId
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const deleteAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const { allocationId } = req.params;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        await LeaveAllocationService.deleteAllocation(
            allocationId,
            organizationId,
            authContext.role
        );

        const responseData = {
            success: true,
            message: 'Allocation deleted successfully',
            data: null,
        };

        sendResponse(res, 200, responseData);
    }
);

// =========================================================================
// EMPLOYEE-SPECIFIC ALLOCATION ENDPOINTS
// =========================================================================

/**
 * @desc    Get allocations for a specific employee
 * @route   GET /api/v1/employees/:id/allocations
 * @access  Protected (HR_ADMIN, ORG_ADMIN, MANAGER, EMPLOYEE, SUPER_ADMIN)
 */
export const getEmployeeAllocations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        // In the employees route, it is /api/v1/employees/:id/allocations
        // So req.params.id is the employeeId.
        const employeeId = req.params.id || req.params.employeeId;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const leaveType = req.query.leaveType as any;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await LeaveAllocationService.getEmployeeAllocations(
            employeeId,
            organizationId,
            authContext.role,
            authContext.employeeId,
            {
                year,
                leaveType,
                page,
                limit,
            }
        );

        const responseData: LeaveAllocationsListResponseDto = {
            success: true,
            message: 'Employee allocations retrieved successfully',
            data: result,
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Create allocation for a specific employee
 * @route   POST /api/v1/employees/:id/allocations
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const createEmployeeAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const employeeId = req.params.id || req.params.employeeId;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        // Override employeeId from body with URL param
        const allocationData = {
            ...req.body,
            employeeId,
        };

        const allocation = await LeaveAllocationService.createAllocation(
            allocationData,
            organizationId
        );

        const responseData = {
            success: true,
            message: 'Leave allocation created successfully',
            data: {
                ...allocation,
                remaining: allocation.allocated - allocation.used,
            },
        };

        sendResponse(res, 201, responseData);
    }
);

/**
 * @desc    Bulk allocate leaves
 * @route   POST /api/v1/org/:organizationId/allocations/bulk
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const bulkAllocate = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const authContext = getAuthContext(req);
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        const result = await LeaveAllocationService.bulkAllocate(
            organizationId,
            req.body
        );

        const responseData: BulkAllocationResponseDto = {
            success: true,
            message: `Successfully allocated leaves to ${result.employees.length} employees`,
            data: result,
        };

        sendResponse(res, 201, responseData);
    }
);

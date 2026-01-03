import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import { LeaveAllocationService } from './allocations.service';
import { GetAllocationsQuery } from './allocations.schema';

// =========================================================================
// FLAT ALLOCATION ENDPOINTS
// =========================================================================

export const getAllocations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const pagination = getPaginationParams(req, 'year', 'desc');
        const filters = req.query as unknown as GetAllocationsQuery;

        const result = await LeaveAllocationService.getAllocations(
            organizationId,
            pagination,
            filters
        );

        sendResponse(res, 200, result);
    }
);

export const getAllocationById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { allocationId } = req.params;

        const allocation = await LeaveAllocationService.getAllocationById(
            organizationId,
            allocationId
        );

        sendResponse(res, 200, allocation);
    }
);

export const updateAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { allocationId } = req.params;

        const allocation = await LeaveAllocationService.updateAllocation(
            organizationId,
            allocationId,
            req.body
        );

        sendResponse(res, 200, allocation, 'Allocation updated successfully');
    }
);

export const deleteAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { allocationId } = req.params;

        await LeaveAllocationService.deleteAllocation(organizationId, allocationId);

        sendResponse(res, 200, null, 'Allocation deleted successfully');
    }
);

export const bulkAllocate = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);

        const result = await LeaveAllocationService.bulkAllocate(
            organizationId,
            req.body
        );

        sendResponse(
            res,
            201,
            result,
            `Successfully allocated leaves to ${result.employees.length} employees`
        );
    }
);

// =========================================================================
// EMPLOYEE-SPECIFIC ALLOCATION ENDPOINTS
// =========================================================================

export const getEmployeeAllocations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const employeeId = req.params.id || req.params.employeeId;
        const pagination = getPaginationParams(req, 'year', 'desc');
        const filters = req.query as unknown as GetAllocationsQuery;

        const result = await LeaveAllocationService.getEmployeeAllocations(
            organizationId,
            employeeId,
            pagination,
            filters
        );

        sendResponse(res, 200, result, 'Employee allocations retrieved successfully');
    }
);

export const createEmployeeAllocation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const employeeId = req.params.id || req.params.employeeId;

        // Override employeeId from body with URL param
        const allocationData = {
            ...req.body,
            employeeId,
        };

        const allocation = await LeaveAllocationService.createAllocation(
            organizationId,
            allocationData
        );

        sendResponse(
            res,
            201,
            {
                ...allocation,
                remaining: allocation.allocated - allocation.used,
            },
            'Leave allocation created successfully'
        );
    }
);

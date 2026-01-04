import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getPaginationParams } from '@/utils/pagination';
import { MemberService } from './members.service';
import { GetUsersQuery, CreateEmployeeInput, UpdateEmployeeInput } from './members.schema';
import { tryGetOrganizationContext } from '@/utils/tenantContext';

// =========================================================================
// UNIFIED CONTROLLERS
// =========================================================================

/**
 * Get Users or Employees based on context
 * - If Tenant Context: Returns Employees of that organization
 * - If Global Context: Returns All Users (Super Admin)
 */
export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);

    // 1. Pagination Params
    // Default sort changes based on context (Users -> createdAt, Employees -> firstName)
    const defaultSortField = organizationId ? 'firstName' : 'createdAt';
    const pagination = getPaginationParams(req, defaultSortField, 'asc');

    let result;

    if (organizationId) {
        // TENANT CONTEXT: List Employees
        const filters = {
            status: req.query.status as any,
            role: req.query.role as any,
            calendarId: req.query.calendarId as string,
            leaveGradeId: req.query.leaveGradeId as string,
        };
        result = await MemberService.getEmployees(organizationId, pagination, filters);
        sendResponse(res, 200, result, 'Organization members retrieved successfully');

    } else {
        // GLOBAL CONTEXT: List Users
        // Note: Super Admin might want to filter by organizationId as a query param effectively handled by resolveTenant
        // But if resolveTenant didn't set it (no param), we list ALL users.
        const filters = req.query as unknown as GetUsersQuery;
        result = await MemberService.getUsers(pagination, filters);
        sendResponse(res, 200, result, 'Users retrieved successfully');
    }
});

/**
 * Get Single User or Employee
 * - If Tenant Context: Returns Employee details
 * - If Global Context: Returns User details
 * - Smart ID handling: If ID is UUID, try both or infer?
 *   - Actually, 'id' param is generic.
 *   - If Org Context -> valid ID is EmployeeID.
 *   - If Global Context -> valid ID is UserID.
 */
export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params; // Using 'id' generically, route should use :id

    if (organizationId) {
        // TENANT CONTEXT: Get Employee
        const result = await MemberService.getEmployee(organizationId, id);
        sendResponse(res, 200, result, 'Member retrieved successfully');
    } else {
        // GLOBAL CONTEXT: Get User
        // Note: Logic for SuperAdmin viewing an Employee by ID vs User by ID logic?
        // Usually /users/:id implies UserID.
        // User requested "keep it only /users".
        // If I am SuperAdmin and request /users/:id -> I expect User record.
        // If I am OrgAdmin and request /users/:id -> I expect Employee record (my member).
        const user = await MemberService.getUserById(id);
        sendResponse(res, 200, user, 'User retrieved successfully');
    }
});

/**
 * Create User or Employee
 */
export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);

    if (organizationId) {
        // TENANT CONTEXT: Create Employee
        const payload = req.body as CreateEmployeeInput;
        const result = await MemberService.createEmployee(organizationId, payload);
        sendResponse(res, 201, result, 'Member created successfully');
    } else {
        // GLOBAL CONTEXT: Create User (Super Admin creating another Admin?)
        // Currently we don't have a specific `createUser` service method for independent users
        // except via Auth (Register) or implicitly.
        // If body has 'organizationId', maybe we validly redirect?
        // For now, restrict to Organization Context for creation unless we implement Global User Create.
        return next(new AppError('Global user creation not implemented. Use specific organization context.', 501));
    }
});

/**
 * Update User or Employee
 */
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params;

    if (organizationId) {
        // TENANT CONTEXT: Update Employee
        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const payload = req.body as UpdateEmployeeInput;
        const result = await MemberService.updateEmployee(organizationId, id, payload, user.role);
        sendResponse(res, 200, result, 'Member updated successfully');
    } else {
        // GLOBAL CONTEXT: Update User
        // Provide logic to update User fields (Role, Email, etc.)?
        // For now, let's say "Not Implemented" or just allow updating basic User props if service supports it.
        // Assuming strict "Employees are Users" flow requested.
        return next(new AppError('Global user update not implemented via this route.', 501));
    }
});

/**
 * Delete User or Employee
 */
export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params;

    if (organizationId) {
        // TENANT CONTEXT: Delete Employee
        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        await MemberService.deleteEmployee(organizationId, id, user.role);
        sendResponse(res, 200, null, 'Member deleted successfully');
    } else {
        // GLOBAL CONTEXT: Delete User
        // await MemberService.deleteUser(id); // Need a global deleteUser method?
        return next(new AppError('Global user deletion not implemented.', 501));
    }
});


/**
 * Update Member Role
 */
export const updateMemberRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params;

    if (organizationId) {
        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const { role } = req.body;
        const result = await MemberService.updateMemberRole(organizationId, id, role, user.role);
        sendResponse(res, 200, result, 'Member role updated successfully');
    } else {
        return next(new AppError('Global user update not implemented via this route.', 501));
    }
});

/**
 * Update Member Calendar
 */
export const updateMemberCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params;

    if (organizationId) {
        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const { calendarId } = req.body;
        const result = await MemberService.updateMemberCalendar(organizationId, id, calendarId, user.role);
        sendResponse(res, 200, result, 'Member calendar updated successfully');
    } else {
        return next(new AppError('Global user update not implemented via this route.', 501));
    }
});

/**
 * Update Member Leave Grade
 */
export const updateMemberLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = tryGetOrganizationContext(req);
    const { id } = req.params;

    if (organizationId) {
        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const { leaveGradeId } = req.body;
        const result = await MemberService.updateMemberLeaveGrade(organizationId, id, leaveGradeId, user.role);
        sendResponse(res, 200, result, 'Member leave grade updated successfully');
    } else {
        return next(new AppError('Global user update not implemented via this route.', 501));
    }
});

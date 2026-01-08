import { Request, NextFunction } from 'express';
import { AppError } from './appError';

/**
 * Tenant Context Utilities
 * 
 * Helper functions for working with multi-tenant organization context.
 * These utilities work in conjunction with the resolveTenant middleware.
 */

/**
 * Get the target organization ID from the request
 * 
 * This function retrieves the organizationId that was set by the resolveTenant middleware.
 * It throws an error if the organization context is not available.
 * 
 * @param req - Express request object
 * @param next - Express next function for error handling
 * @returns The target organization ID
 * @throws AppError if organization context is not available
 * 
 * @example
 * ```typescript
 * export const getEmployees = catchAsync(async (req, res, next) => {
 *   const organizationId = getOrganizationContext(req, next);
 *   const employees = await EmployeeService.findAll(organizationId);
 *   sendResponse(res, 200, employees);
 * });
 * ```
 */
export const getOrganizationContext = (req: Request, next: NextFunction): string => {
    // 1. Try middleware-resolved context first
    const organizationId = req.targetOrganizationId;

    if (organizationId) return organizationId;

    // 2. Fallback to authenticated user's organization 
    // This supports routes where resolveTenant middleware might not be used but user is logged in
    if (req.user?.organizationId) {
        return req.user.organizationId;
    }

    throw new AppError('Organization context is required', 400);
};

/**
 * Try to get the target organization ID from the request
 * 
 * Similar to getOrganizationContext but returns undefined instead of throwing
 * an error if the organization context is not available. Useful for optional
 * organization scoping.
 * 
 * @param req - Express request object
 * @returns The target organization ID or undefined
 * 
 * @example
 * ```typescript
 * export const getItems = catchAsync(async (req, res, next) => {
 *   const organizationId = tryGetOrganizationContext(req);
 *   const items = organizationId 
 *     ? await ItemService.findByOrg(organizationId)
 *     : await ItemService.findAll();
 *   sendResponse(res, 200, items);
 * });
 * ```
 */
export const tryGetOrganizationContext = (req: Request): string | undefined => {
    return req.targetOrganizationId || req.user?.organizationId;
};

import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import { EmployeeService } from './employees.service';
import { CreateEmployeeInput, UpdateEmployeeInput, GetEmployeesQuery } from './employees.schema';

/**
 * Get Employees List
 */
export const getEmployees = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);

  // 1. Pagination Params
  const pagination = getPaginationParams(req, 'firstName', 'asc'); // Default sort by firstName ASC

  // 2. Filter Params (Manually extract from casting rq.query or use helper if complicated)
  // Since we validated with Zod, we trust the types but req.query values are strings mostly.
  // However, our validation schema handles some coercions if setup, but here we just extract key fields.
  const filters = {
    status: req.query.status as any,
    role: req.query.role as any,
    calendarId: req.query.calendarId as string,
    leaveGradeId: req.query.leaveGradeId as string,
  };

  const result = await EmployeeService.getEmployees(organizationId, pagination, filters);
  sendResponse(res, 200, result, 'Employees retrieved successfully');
});

/**
 * Get Single Employee
 */
export const getEmployee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const { id } = req.params;

  const result = await EmployeeService.getEmployee(organizationId, id);
  sendResponse(res, 200, result, 'Employee retrieved successfully');
});

/**
 * Create Employee
 */
export const createEmployee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  // Payload is validated by middleware against createEmployeeSchema
  const payload = req.body as CreateEmployeeInput;

  const result = await EmployeeService.createEmployee(organizationId, payload);
  sendResponse(res, 201, result, 'Employee created successfully');
});

/**
 * Update Employee
 */
export const updateEmployee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const { id } = req.params;
  const payload = req.body as UpdateEmployeeInput;

  const result = await EmployeeService.updateEmployee(organizationId, id, payload);
  sendResponse(res, 200, result, 'Employee updated successfully');
});

/**
 * Delete Employee
 */
export const deleteEmployee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const { id } = req.params;

  await EmployeeService.deleteEmployee(organizationId, id);
  sendResponse(res, 200, null, 'Employee deleted successfully');
});

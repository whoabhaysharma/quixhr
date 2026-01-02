import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { EmployeeService } from './employees.service';
import { AuthContext } from './employees.types';
import { AppError } from '@/utils/appError';
import {
  EmployeeResponseDto,
  EmployeeDetailsResponseDto,
  EmployeesListResponseDto,
} from './employees.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request): AuthContext => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  return user as AuthContext;
};

// =========================================================================
// EMPLOYEE ENDPOINTS
// =========================================================================

/**
 * @desc    Get all employees (Scoped by tenant)
 * @route   GET /api/v1/employees
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const getEmployees = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    // targetCompanyId is set by resolveTenant middleware
    const companyId = req.targetCompanyId;

    if (!companyId) {
      return next(new AppError('Company context is required', 400));
    }

    // We will pass the raw query to the service, or use ApiFeatures there.
    // Ideally, the service should handle the "business logic" of filtering.
    // We already have specific params: page, limit, search...
    // Let's pass query + companyId.

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Filters
    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      calendarId: req.query.calendarId as string,
      leaveGradeId: req.query.leaveGradeId as string,
    };

    const result = await EmployeeService.getEmployees({
      authContext,
      companyId,
      page,
      limit,
      ...filters
    });

    const responseData: EmployeesListResponseDto = {
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees: result.employees,
        pagination: result.pagination,
      },
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Get employee details by ID
 * @route   GET /api/v1/employees/:id
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN, or own profile)
 */
export const getEmployeeById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { id } = req.params;
    const companyId = req.targetCompanyId;

    if (!companyId) {
      return next(new AppError('Company context is required', 400));
    }

    const employee = await EmployeeService.getEmployeeById({
      authContext,
      companyId,
      employeeId: id,
    });

    const responseData: EmployeeDetailsResponseDto = {
      success: true,
      message: 'Employee details retrieved successfully',
      data: employee,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create a new employee
 * @route   POST /api/v1/companies/:companyId/employees
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const createEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;

    const employee = await EmployeeService.createEmployee({
      authContext,
      companyId,
      data: req.body,
    });

    const responseData: EmployeeResponseDto = {
      success: true,
      message: 'Employee created successfully',
      data: employee,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update employee
 * @route   PATCH /api/v1/employees/:id
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const updateEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { id } = req.params;
    const companyId = req.targetCompanyId;

    if (!companyId) {
      return next(new AppError('Company context is required', 400));
    }

    const employee = await EmployeeService.updateEmployee({
      authContext,
      companyId,
      employeeId: id,
      data: req.body,
    });

    const responseData: EmployeeResponseDto = {
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Delete employee
 * @route   DELETE /api/v1/employees/:id
 * @access  Protected (SUPER_ADMIN only)
 */
export const deleteEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { id } = req.params;
    const companyId = req.targetCompanyId;

    if (!companyId) {
      return next(new AppError('Company context is required', 400));
    }

    await EmployeeService.deleteEmployee({
      authContext,
      companyId,
      employeeId: id,
    });

    const responseData = {
      success: true,
      message: 'Employee deleted successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);
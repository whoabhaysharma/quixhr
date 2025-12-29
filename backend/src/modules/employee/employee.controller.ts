import { Request, Response } from 'express';
import * as EmployeeService from './employee.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    List all employees with filters
 * @route   GET /api/v1/employees
 * @access  Manager+
 */
export const listEmployees = catchAsync(async (req: Request, res: Response) => {
    // SUPER_ADMIN: targetCompanyId can be undefined (all companies) or specific company
    // Others: targetCompanyId is always their own companyId
    const companyId = req.targetCompanyId;
    const filters = req.query;

    const employees = await EmployeeService.listEmployees(companyId, filters);

    sendResponse(res, 200, { employees, count: employees.length }, 'Employees retrieved successfully');
});

/**
 * @desc    Create new employee (manual entry)
 * @route   POST /api/v1/employees
 * @access  HR Admin
 */
export const createEmployee = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required for creating employees' });
    }

    const employee = await EmployeeService.createEmployee(companyId, req.body);

    sendResponse(res, 201, { employee }, 'Employee created successfully');
});

/**
 * @desc    Get employee by ID with full profile
 * @route   GET /api/v1/employees/:id
 * @access  Manager+
 */
export const getEmployeeById = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const employee = await EmployeeService.getEmployeeById(id, companyId);

    sendResponse(res, 200, { employee }, 'Employee retrieved successfully');
});

/**
 * @desc    Update employee profile
 * @route   PATCH /api/v1/employees/:id
 * @access  HR Admin
 */
export const updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const employee = await EmployeeService.updateEmployee(id, companyId, req.body);

    sendResponse(res, 200, { employee }, 'Employee updated successfully');
});

/**
 * @desc    Assign calendar and/or leave grade to employee
 * @route   PATCH /api/v1/employees/:id/assign
 * @access  HR Admin
 */
export const assignConfig = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const employee = await EmployeeService.assignConfig(id, companyId, req.body);

    sendResponse(res, 200, { employee }, 'Employee configuration updated successfully');
});

/**
 * @desc    Update employee status (offboarding)
 * @route   PATCH /api/v1/employees/:id/status
 * @access  HR Admin
 */
export const updateStatus = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const employee = await EmployeeService.updateStatus(id, companyId, req.body);

    sendResponse(res, 200, { employee }, 'Employee status updated successfully');
});

/**
 * @desc    Get current employee's own profile
 * @route   GET /api/v1/employees/my-profile
 * @access  Employee (any authenticated user)
 */
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;

    const employee = await EmployeeService.getMyProfile(userId);

    sendResponse(res, 200, { employee }, 'Profile retrieved successfully');
});

/**
 * @desc    Bulk import employees via CSV
 * @route   POST /api/v1/employees/import
 * @access  HR Admin
 */
export const importEmployees = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required for importing employees' });
    }

    const { employees } = req.body;

    const results = await EmployeeService.importEmployees(companyId, employees);

    sendResponse(res, 200, results, `Import completed. Success: ${results.success.length}, Failed: ${results.failed.length}`);
});

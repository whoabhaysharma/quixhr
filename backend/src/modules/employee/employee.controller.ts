import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import * as employeeService from './employee.service';
import { Role } from '@prisma/client';

const createEmployeeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
    companyId: z.string().uuid('Invalid company ID'),
});

const updateEmployeeSchema = z.object({
    name: z.string().optional(),
    status: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
});

/**
 * Create a new employee
 */
export async function create(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = createEmployeeSchema.parse(req.body);

        // Security check: Only HR_ADMIN can create employees
        // And they can only create for their own company unless SUPER_ADMIN
        if (req.user?.role !== Role.SUPER_ADMIN && req.user?.role !== Role.HR_ADMIN) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }

        if (req.user?.role === Role.HR_ADMIN && req.user.companyId !== dto.companyId) {
            res.status(403).json({ success: false, error: 'Cannot create employee for another company' });
            return;
        }

        const employee = await employeeService.createEmployee(dto);
        res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to create employee' });
    }
}

/**
 * Get all employees
 */
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        let companyId = req.query.companyId as string;

        // Security: Restrict to own company for non-SUPER_ADMIN
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (!req.user?.companyId) {
                res.status(400).json({ success: false, error: 'User does not belong to a company' });
                return;
            }
            companyId = req.user.companyId;
        } else if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID is required for Super Admin' });
            return;
        }

        const result = await employeeService.getAllEmployees(companyId, page, limit, search);
        res.json({ success: true, data: result.data, pagination: { page, limit, total: result.total } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch employees' });
    }
}

/**
 * Get employee by ID
 */
export async function getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);

        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Must be in same company
            if (employee.companyId !== req.user?.companyId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // If strictly an EMPLOYEE (not HR/Manager), can only view own profile
            if (req.user.role === Role.EMPLOYEE && req.user.employeeId !== employee.id) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }
        }

        res.json({ success: true, data: employee });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch employee' });
    }
}

/**
 * Update employee
 */
export async function update(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = updateEmployeeSchema.parse(req.body);
        const { id } = req.params;

        const existingEmployee = await employeeService.getEmployeeById(id);
        if (!existingEmployee) {
            res.status(404).json({ success: false, error: 'Employee not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Only HR_ADMIN of the same company
            if (req.user?.role !== Role.HR_ADMIN || req.user.companyId !== existingEmployee.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        const employee = await employeeService.updateEmployee(id, dto);
        res.json({ success: true, data: employee });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update employee' });
    }
}

/**
 * Delete employee
 */
export async function deleteOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const existingEmployee = await employeeService.getEmployeeById(id);

        if (!existingEmployee) {
            res.status(404).json({ success: false, error: 'Employee not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Only HR_ADMIN of the same company
            if (req.user?.role !== Role.HR_ADMIN || req.user.companyId !== existingEmployee.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await employeeService.deleteEmployee(id);
        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to delete employee' });
    }
}

/**
 * Assign calendar to employee
 */
export async function assignCalendar(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { calendarId } = req.body;

        if (!calendarId) {
            res.status(400).json({ success: false, error: 'Calendar ID is required' });
            return;
        }

        const employee = await employeeService.getEmployeeById(id);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== employee.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await employeeService.assignCalendarToEmployee(id, calendarId);
        res.json({ success: true, message: 'Calendar assigned to employee successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to assign calendar' });
    }
}

import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { CreateEmployeeDTO, UpdateEmployeeDTO, AssignConfigDTO, UpdateStatusDTO, EmployeeFilters, ImportEmployeeRow } from './employee.types';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * List all employees with optional filters
 * @param companyId - Required for non-SUPER_ADMIN, optional for SUPER_ADMIN
 * @param filters - Status and department filters
 */
export const listEmployees = async (companyId: string | undefined, filters: EmployeeFilters) => {
    const where: any = {};

    // Apply company filter
    // - If companyId is provided, filter by that company
    // - If companyId is undefined (SUPER_ADMIN without filter), show all companies
    if (companyId) {
        where.companyId = companyId;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    // Note: dept filter would require a department field in schema
    // For now, we'll ignore it or you can add department to Employee model

    const employees = await prisma.employee.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            company: {
                select: {
                    id: true,
                    name: true,
                },
            },
            calendar: {
                select: {
                    id: true,
                    name: true,
                },
            },
            leaveGrade: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            joiningDate: 'desc',
        },
    });

    return employees;
};

/**
 * Create a new employee (manual entry, no user account)
 */
export const createEmployee = async (companyId: string, data: CreateEmployeeDTO) => {
    // Verify company exists
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Company not found', 404);

    // Verify calendar if provided
    if (data.calendarId) {
        const calendar = await prisma.calendar.findFirst({
            where: { id: data.calendarId, companyId },
        });
        if (!calendar) throw new AppError('Calendar not found', 404);
    }

    // Verify leave grade if provided
    if (data.leaveGradeId) {
        const leaveGrade = await prisma.leaveGrade.findFirst({
            where: { id: data.leaveGradeId, companyId },
        });
        if (!leaveGrade) throw new AppError('Leave grade not found', 404);
    }

    const employee = await prisma.employee.create({
        data: {
            companyId,
            firstName: data.firstName,
            lastName: data.lastName,
            code: data.code,
            status: data.status || 'ACTIVE',
            joiningDate: data.joiningDate,
            calendarId: data.calendarId,
            leaveGradeId: data.leaveGradeId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            calendar: true,
            leaveGrade: true,
        },
    });

    return employee;
};

/**
 * Get employee by ID with full profile
 * @param employeeId - The employee ID to fetch
 * @param companyId - Required for non-SUPER_ADMIN, optional for SUPER_ADMIN
 */
export const getEmployeeById = async (employeeId: string, companyId: string | undefined) => {
    const where: any = { id: employeeId };

    // Apply company filter if provided
    if (companyId) {
        where.companyId = companyId;
    }

    const employee = await prisma.employee.findFirst({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isEmailVerified: true,
                },
            },
            company: {
                select: {
                    id: true,
                    name: true,
                    timezone: true,
                    currency: true,
                },
            },
            calendar: {
                include: {
                    weeklyRules: true,
                    holidays: true,
                },
            },
            leaveGrade: {
                include: {
                    policies: true,
                },
            },
            leaveAllocations: true,
        },
    });

    if (!employee) throw new AppError('Employee not found', 404);

    return employee;
};

/**
 * Update employee profile
 * @param employeeId - The employee ID to update
 * @param companyId - Required for non-SUPER_ADMIN, optional for SUPER_ADMIN
 * @param data - Update data
 */
export const updateEmployee = async (employeeId: string, companyId: string | undefined, data: UpdateEmployeeDTO) => {
    const where: any = { id: employeeId };

    if (companyId) {
        where.companyId = companyId;
    }

    const employee = await prisma.employee.findFirst({ where });

    if (!employee) throw new AppError('Employee not found', 404);

    const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            code: data.code,
            status: data.status,
            joiningDate: data.joiningDate,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            calendar: true,
            leaveGrade: true,
        },
    });

    return updated;
};

/**
 * Assign calendar and/or leave grade to employee
 * @param employeeId - The employee ID
 * @param companyId - Required for non-SUPER_ADMIN, optional for SUPER_ADMIN
 * @param data - Assignment data
 */
export const assignConfig = async (employeeId: string, companyId: string | undefined, data: AssignConfigDTO) => {
    const where: any = { id: employeeId };

    if (companyId) {
        where.companyId = companyId;
    }

    const employee = await prisma.employee.findFirst({ where });

    if (!employee) throw new AppError('Employee not found', 404);

    // Use the employee's actual companyId for validation
    const effectiveCompanyId = employee.companyId;

    // Verify calendar if provided
    if (data.calendarId) {
        const calendar = await prisma.calendar.findFirst({
            where: { id: data.calendarId, companyId: effectiveCompanyId },
        });
        if (!calendar) throw new AppError('Calendar not found', 404);
    }

    // Verify leave grade if provided
    if (data.leaveGradeId) {
        const leaveGrade = await prisma.leaveGrade.findFirst({
            where: { id: data.leaveGradeId, companyId: effectiveCompanyId },
        });
        if (!leaveGrade) throw new AppError('Leave grade not found', 404);
    }

    const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
            calendarId: data.calendarId,
            leaveGradeId: data.leaveGradeId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            calendar: true,
            leaveGrade: true,
        },
    });

    return updated;
};

/**
 * Update employee status (for offboarding)
 * @param employeeId - The employee ID
 * @param companyId - Required for non-SUPER_ADMIN, optional for SUPER_ADMIN
 * @param data - Status update data
 */
export const updateStatus = async (employeeId: string, companyId: string | undefined, data: UpdateStatusDTO) => {
    const where: any = { id: employeeId };

    if (companyId) {
        where.companyId = companyId;
    }

    const employee = await prisma.employee.findFirst({ where });

    if (!employee) throw new AppError('Employee not found', 404);

    const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
            status: data.status,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    return updated;
};

/**
 * Get employee's own profile
 */
export const getMyProfile = async (userId: string) => {
    const employee = await prisma.employee.findFirst({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isEmailVerified: true,
                },
            },
            company: {
                select: {
                    id: true,
                    name: true,
                    timezone: true,
                    currency: true,
                },
            },
            calendar: {
                include: {
                    weeklyRules: true,
                    holidays: true,
                },
            },
            leaveGrade: {
                include: {
                    policies: true,
                },
            },
            leaveAllocations: true,
        },
    });

    if (!employee) throw new AppError('Employee profile not found', 404);

    return employee;
};

/**
 * Bulk import employees
 */
export const importEmployees = async (companyId: string, employees: ImportEmployeeRow[]) => {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Company not found', 404);

    const results = {
        success: [] as any[],
        failed: [] as any[],
    };

    for (const emp of employees) {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: emp.email },
            });

            if (existingUser) {
                results.failed.push({
                    email: emp.email,
                    reason: 'Email already exists',
                });
                continue;
            }

            // Create user account with default password
            const defaultPassword = await bcrypt.hash('Welcome@123', 12);
            const user = await prisma.user.create({
                data: {
                    email: emp.email,
                    password: defaultPassword,
                    role: Role.EMPLOYEE,
                },
            });

            // Create employee profile
            const employee = await prisma.employee.create({
                data: {
                    companyId,
                    userId: user.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    code: emp.code,
                    status: emp.status || 'ACTIVE',
                    joiningDate: new Date(emp.joiningDate),
                },
            });

            results.success.push({
                email: emp.email,
                employeeId: employee.id,
            });
        } catch (error: any) {
            results.failed.push({
                email: emp.email,
                reason: error.message || 'Unknown error',
            });
        }
    }

    return results;
};

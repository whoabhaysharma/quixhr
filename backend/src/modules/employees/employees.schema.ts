import { z } from 'zod';
import { Role } from '@prisma/client';

// =========================================================================
// REQUEST VALIDATION SCHEMAS
// =========================================================================

/**
 * Schema for creating a new employee
 */
export const createEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    code: z.string().max(20).optional(),
    status: z.string().default('ACTIVE'),
    joiningDate: z.string().datetime().or(z.date()),
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  }),
};

/**
 * Schema for updating an employee
 */
export const updateEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    code: z.string().max(20).optional(),
    status: z.string().optional(),
    joiningDate: z.string().datetime().or(z.date()).optional(),
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
};

/**
 * Schema for getting employee by ID
 */
export const getEmployeeSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
};

/**
 * Schema for listing employees
 */
export const getEmployeesSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
  }),
};

/**
 * Schema for deleting employee
 */
export const deleteEmployeeSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

/**
 * Employee response DTO
 */
export interface EmployeeResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    code?: string | null;
    status: string;
    joiningDate: Date;
    email?: string | null;
    role?: Role | null;
    calendar?: {
      id: string;
      name: string;
    } | null;
    leaveGrade?: {
      id: string;
      name: string;
    } | null;
  };
}

/**
 * Employee details response DTO (includes more detailed information)
 */
export interface EmployeeDetailsResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    code?: string | null;
    status: string;
    joiningDate: Date;
    user?: {
      id: string;
      email: string;
      role: Role;
      isEmailVerified: boolean;
    } | null;
    calendar?: {
      id: string;
      name: string;
      dayStartTime: number;
      dayEndTime: number;
    } | null;
    leaveGrade?: {
      id: string;
      name: string;
      policies: Array<{
        leaveType: string;
        totalDays: number;
        carryForward: boolean;
      }>;
    } | null;
  };
}

/**
 * Employees list response DTO
 */
export interface EmployeesListResponseDto {
  success: boolean;
  message: string;
  data: {
    employees: Array<{
      id: string;
      companyId: string;
      firstName: string;
      lastName: string;
      fullName: string;
      code?: string | null;
      status: string;
      joiningDate: Date;
      email?: string | null;
      role?: Role | null;
      calendar?: {
        id: string;
        name: string;
      } | null;
      leaveGrade?: {
        id: string;
        name: string;
      } | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// =========================================================================
// TYPE EXPORTS FOR REQUEST VALIDATION
// =========================================================================

export type CreateEmployeeRequestDto = z.infer<typeof createEmployeeSchema.body>;
export type UpdateEmployeeRequestDto = z.infer<typeof updateEmployeeSchema.body>;
export type GetEmployeeParamsDto = z.infer<typeof getEmployeeSchema.params>;
export type GetEmployeesQueryDto = z.infer<typeof getEmployeesSchema.query>;
export type GetEmployeesParamsDto = z.infer<typeof getEmployeesSchema.params>;
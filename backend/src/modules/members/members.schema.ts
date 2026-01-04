import { z } from 'zod';
import { Role } from '@prisma/client';
import { paginationSchema } from '@/utils/pagination';

// =========================================================================
// QUERY SCHEMAS
// =========================================================================

export const getUsersQuerySchema = {
    query: paginationSchema.extend({
        role: z.nativeEnum(Role).optional(),
        email: z.string().optional(),
        sortBy: z.enum(['email', 'role', 'createdAt']).optional(),
    }),
};

export const userIdSchema = {
    params: z.object({
        userId: z.string().uuid(),
    }),
};

// =========================================================================
// TYPES (Inferred)
// =========================================================================

// =========================================================================
// TYPES (Inferred)
// =========================================================================

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema.query>;

// =========================================================================
// EMPLOYEE SCHEMAS (Consolidated)
// =========================================================================

export const createEmployeeSchema = {
    body: z.object({
        firstName: z.string().min(1, 'First name is required').max(50),
        lastName: z.string().min(1, 'Last name is required').max(50),
        email: z.string().email('Invalid email format').optional(),
        code: z.string().max(20).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
        joiningDate: z.coerce.date(),
        role: z.nativeEnum(Role).default(Role.EMPLOYEE),

        // Relations
        calendarId: z.string().uuid().optional(),
        leaveGradeId: z.string().uuid().optional(),
    }),
};

export const updateEmployeeSchema = {
    params: z.object({
        id: z.string().uuid('Invalid employee ID'),
    }),
    body: z.object({
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        code: z.string().max(20).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
        joiningDate: z.coerce.date().optional(),
        // role, calendarId, leaveGradeId removed - use dedicated endpoints
    }),
};

export const updateMemberRoleSchema = {
    params: z.object({
        id: z.string().uuid('Invalid member ID'),
    }),
    body: z.object({
        role: z.nativeEnum(Role),
    }),
};

export const updateMemberCalendarSchema = {
    params: z.object({
        id: z.string().uuid('Invalid member ID'),
    }),
    body: z.object({
        calendarId: z.string().uuid('Invalid calendar ID'),
    }),
};

export const updateMemberLeaveGradeSchema = {
    params: z.object({
        id: z.string().uuid('Invalid member ID'),
    }),
    body: z.object({
        leaveGradeId: z.string().uuid('Invalid leave grade ID'),
    }),
};

export const getEmployeesQuerySchema = {
    query: paginationSchema.extend({
        status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
        role: z.nativeEnum(Role).optional(),
        calendarId: z.string().uuid().optional(),
        leaveGradeId: z.string().uuid().optional(),
    })
};

export const employeeIdSchema = {
    params: z.object({
        id: z.string().uuid('Invalid employee ID'),
    }),
};

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema.body>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema.body>;
export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema.query>;


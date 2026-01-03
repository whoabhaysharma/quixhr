import { z } from 'zod';
import { Role } from '@prisma/client';
import { paginationSchema } from '@/utils/pagination';

// =========================================================================
// REQUEST VALIDATION SCHEMAS
// =========================================================================

export const createEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email format').optional(),
    code: z.string().max(20).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'), // Explicit enum is better than string
    joiningDate: z.coerce.date(),
    role: z.nativeEnum(Role).default(Role.EMPLOYEE),

    // Relations (Optional during creation, can be assigned later)
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

    // Relations
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
  }),
};

export const getEmployeesQuerySchema = {
  // Extend shared pagination schema
  query: paginationSchema.extend({
    // Specific Filters
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

// =========================================================================
// TYPES
// =========================================================================

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema.body>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema.body>;
export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema.query>;
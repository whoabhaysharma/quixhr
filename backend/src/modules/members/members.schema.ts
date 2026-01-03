import { z } from 'zod';
import { Role, AttendanceStatus } from '@prisma/client';

export const createMemberSchema = z.object({
  body: z.object({
    // User Data
    email: z.string().email().optional(),
    role: z.nativeEnum(Role).optional(),

    // Employee Data
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    code: z.string().optional(),
    joiningDate: z.string().datetime().or(z.string()), // Accept ISO string

    // Config
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),

    status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED']).default('ACTIVE'),
  }),
});

export const updateMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    role: z.nativeEnum(Role).optional(),

    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    code: z.string().optional(),
    joiningDate: z.string().datetime().or(z.string()).optional(),

    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),

    status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED']).optional(),
  }),
});

export const getMembersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),

    // Filters
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
  }),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>['body'];
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>['body'];
export type GetMembersQuery = z.infer<typeof getMembersQuerySchema>['query'];

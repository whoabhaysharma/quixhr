import { z } from 'zod';
import { Role } from '@prisma/client';

export const getCompanySchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
    }),
});

export const updateCompanySchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
    }),
    body: z.object({
        logoUrl: z.string().url('Invalid logo URL').optional(),
        currency: z.string().min(3).max(3, 'Currency must be 3-letter code (e.g., USD, INR)').optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
    }),
});

export const getDashboardSchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
    }),
});

export const listUsersSchema = z.object({
    query: z.object({
        role: z.nativeEnum(Role).optional(),
    }).optional(),
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
    body: z.object({
        role: z.nativeEnum(Role, { message: 'Invalid role' }),
    }),
});


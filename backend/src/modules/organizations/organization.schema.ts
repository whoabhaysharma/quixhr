import { z } from 'zod';

export const updateOrganizationSchema = {
    body: z.object({
        name: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
        dateFormat: z.string().optional(),
        logoUrl: z.string().url().optional(),
    }),
};

export const getOrganizationsQuerySchema = {
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
};

export const auditLogQuerySchema = {
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        sortBy: z.enum(['createdAt', 'action', 'entity']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
};


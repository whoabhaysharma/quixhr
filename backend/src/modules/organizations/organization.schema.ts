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

export const auditLogQuerySchema = {
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
};

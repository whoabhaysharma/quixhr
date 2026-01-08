import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const updateOrganizationSchema = {
    body: z.object({
        name: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
        dateFormat: z.string().optional(),
        logoUrl: z.string().url().optional(),
    }),
};

// Merge common pagination with specific requirements if needed, 
// or just use the common schema directly in the route if distinct fields aren't needed.
// For now, we reuse the loose common schema but we can refine specific allowedEnums here if strictly necessary.
// But to keep it "common list getting params", we'll just extend/use it.

export const getOrganizationsQuerySchema = {
    query: paginationSchema.extend({
        sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
    })
};

export const auditLogQuerySchema = {
    query: paginationSchema.extend({
        sortBy: z.enum(['createdAt', 'action', 'entity']).optional(),
    })
};

// Response DTOs
import { PaginatedResponse } from '@/utils/pagination';

export interface OrganizationResponseDto {
    id: string;
    name: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    logoUrl?: string;
    createdAt: Date;
}

export type OrganizationListResponseDto = PaginatedResponse<OrganizationResponseDto>;


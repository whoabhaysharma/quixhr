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

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema.query>;

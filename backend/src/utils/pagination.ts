import { z } from 'zod';
import { Request } from 'express';

/**
 * Common Pagination & Filtering Schema
 * Use this to validate query parameters for list endpoints.
 */
export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface ParsedPagination {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
}

/**
 * Extract pagination parameters from request query
 * Helper to get strongly typed defaults for list capabilities.
 */
export const getPaginationParams = (req: Request, defaultSortBy: string = 'createdAt', defaultSortOrder: 'asc' | 'desc' = 'desc'): ParsedPagination => {
    // These casts are safe because we should run validation middleware before this
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || defaultSortBy;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || defaultSortOrder;

    return {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        skip: (page - 1) * limit
    };
};

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

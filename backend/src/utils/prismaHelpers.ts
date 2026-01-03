import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';

type SortOrder = 'asc' | 'desc';

interface SortConfig {
    /**
     * Fields allowed to be sorted directly (e.g. 'firstName')
     */
    allowedFields: string[];

    /**
     * Custom mappings for complex sorts (e.g. 'email' -> { user: { email: sortOrder } })
     * The value should be a function taking SortOrder and returning the Prisma OrderBy object,
     * OR a static object structure where the leaf 'asc'/'desc' string is replaced (less safe).
     * Better: Mapping key -> (order: SortOrder) => object
     */
    mappings?: Record<string, (order: SortOrder) => any>;

    /**
     * Default sort object if no valid sortBy is provided
     */
    defaultSort?: any;
}

/**
 * Builds a Prisma orderBy object based on config
 */
export const buildOrderBy = (
    sortBy: string | undefined,
    sortOrder: SortOrder = 'asc',
    config: SortConfig
) => {
    if (!sortBy) {
        return config.defaultSort || { createdAt: 'desc' };
    }

    // 1. Check Custom Mappings
    if (config.mappings && config.mappings[sortBy]) {
        return config.mappings[sortBy](sortOrder);
    }

    // 2. Check Allowed Fields
    if (config.allowedFields.includes(sortBy)) {
        return { [sortBy]: sortOrder };
    }

    // 3. Fallback
    return config.defaultSort || { createdAt: 'desc' };
};

/**
 * Validates that a resource exists and belongs to the organization.
 * @param model - Prisma model name (e.g. 'calendar', 'leaveGrade')
 * @param id - Resource ID
 * @param organizationId - Organization ID
 * @param errorLabel - Label for error message (default: Resource)
 */
export const validateOrganizationResource = async (
    model: keyof typeof prisma,
    id: string,
    organizationId: string,
    errorLabel: string = 'Resource'
) => {
    // We use "any" cast because we are dynamically accessing prisma models
    // and we assume the model has 'id' and 'organizationId' fields.
    // This is a trade-off for generic utility.
    const resource = await (prisma[model] as any).findFirst({
        where: {
            id,
            organizationId,
        },
        select: { id: true },
    });

    if (!resource) {
        throw new AppError(`Invalid ${errorLabel} ID or it does not belong to this organization`, 400);
    }

    return resource;
};

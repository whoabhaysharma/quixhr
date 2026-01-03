
export interface QueryOptions {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
}

export const getQueryOptions = (
    query: any,
    allowedFilterFields: string[] = []
): QueryOptions => {
    // 1. Filtering
    const where: any = {};

    // Standard exclusions
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'organizationId']; // organizationId handled by middleware

    Object.keys(query).forEach(key => {
        if (!excludedFields.includes(key) && allowedFilterFields.includes(key)) {
            // Basic exact match for now. 
            // Can be expanded to support gt, lt, contains etc. if needed.
            // e.g. status=ACTIVE
            where[key] = query[key];
        }
    });

    // 2. Sorting
    let orderBy: any = undefined;
    if (query.sort) {
        const sortBy = (query.sort as string).split(',').map(field => {
            const direction = field.startsWith('-') ? 'desc' : 'asc';
            const cleanField = field.replace('-', '');
            return { [cleanField]: direction };
        });
        orderBy = sortBy;
    } else {
        // Default sort
        orderBy = { createdAt: 'desc' };
    }

    // 3. Pagination
    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const take = limit > 100 ? 100 : limit; // Hard cap at 100

    return {
        where,
        orderBy,
        skip,
        take
    };
};
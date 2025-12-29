export const getPagination = (query: any) => {
    const page = Math.abs(parseInt(query.page)) || 1;
    const limit = Math.abs(parseInt(query.limit)) || 10;
    const skip = (page - 1) * limit;

    return { skip, take: limit };
};

// Example usage in a Service:
// const { skip, take } = getPagination(req.query);
// const employees = await prisma.employee.findMany({ skip, take, where: { companyId } });
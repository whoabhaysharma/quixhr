import { PrismaClient, Company } from '@prisma/client';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponseDto } from './company.types';

const prisma = new PrismaClient();

/**
 * Create a new company
 */
export async function createCompany(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const company = await prisma.company.create({
        data: {
            name: dto.name,
            timezone: dto.timezone || 'UTC',
        },
    });

    return company;
}

/**
 * Get all companies
 */
export async function getAllCompanies(): Promise<CompanyResponseDto[]> {
    const companies = await prisma.company.findMany({
        include: {
            _count: {
                select: { employees: true },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    return companies;
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string): Promise<CompanyResponseDto | null> {
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            _count: {
                select: { employees: true },
            },
        },
    });

    return company;
}

/**
 * Update company
 */
export async function updateCompany(id: string, dto: UpdateCompanyDto, updatedByName?: string): Promise<CompanyResponseDto> {
    const company = await prisma.company.update({
        where: { id },
        data: {
            ...dto,
        },
        include: {
            employees: {
                where: {
                    user: {
                        role: {
                            in: ['HR_ADMIN', 'SUPER_ADMIN'],
                        },
                    },
                },
                select: {
                    userId: true,
                },
            },
        },
    });

    // Notify all HR admins about company settings update
    const adminUserIds = company.employees.map(emp => emp.userId);
    if (adminUserIds.length > 0) {
        const { notifyCompany } = await import('../notification/notification.helper');
        await notifyCompany.settingsUpdated(adminUserIds, updatedByName || 'Admin');
    }

    return company;
}

/**
 * Delete company
 */
export async function deleteCompany(id: string): Promise<void> {
    // Check if company has employees before deleting
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            _count: {
                select: { employees: true },
            },
        },
    });

    if (company && company._count && company._count.employees > 0) {
        throw new Error('Cannot delete company with active employees');
    }

    await prisma.company.delete({
        where: { id },
    });
}

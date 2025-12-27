import { PrismaClient, Role } from '@prisma/client';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeResponseDto } from './employee.types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createEmployee(dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    // Check if user exists, if not create one
    let user = await prisma.user.findUnique({
        where: { email: dto.email }
    });

    if (!user) {
        // Create default user with random password
        // In a real app, we'd send an invite email
        const generatedPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        user = await prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: (dto.role as Role) || Role.EMPLOYEE,
                emailVerified: false,
            }
        });
    }

    const employee = await prisma.employee.create({
        data: {
            userId: user.id,
            companyId: dto.companyId,
            name: dto.name,
            status: dto.status || 'ACTIVE',
        },
        include: {
            user: true
        }
    });

    return {
        id: employee.id,
        userId: employee.userId,
        companyId: employee.companyId,
        name: employee.name,
        status: employee.status,
        email: employee.user.email,
        role: employee.user.role,
        createdAt: employee.createdAt
    };
}

export async function getAllEmployees(companyId: string, page = 1, limit = 10, search?: string): Promise<{ data: EmployeeResponseDto[], total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
        companyId,
    };

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const [employees, total] = await Promise.all([
        prisma.employee.findMany({
            where,
            include: { user: true },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.employee.count({ where })
    ]);

    const data = employees.map(emp => ({
        id: emp.id,
        userId: emp.userId,
        companyId: emp.companyId,
        name: emp.name,
        status: emp.status,
        email: emp.user.email,
        role: emp.user.role,
        createdAt: emp.createdAt
    }));

    return { data, total };
}

export async function getEmployeeById(id: string): Promise<EmployeeResponseDto | null> {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!employee) return null;

    return {
        id: employee.id,
        userId: employee.userId,
        companyId: employee.companyId,
        name: employee.name,
        status: employee.status,
        email: employee.user.email,
        role: employee.user.role,
        createdAt: employee.createdAt
    };
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await prisma.employee.update({
        where: { id },
        data: {
            name: dto.name,
            status: dto.status,
        },
        include: { user: true }
    });

    // Update role if provided
    if (dto.role) {
        await prisma.user.update({
            where: { id: employee.userId },
            data: { role: dto.role as Role }
        });
        employee.user.role = dto.role as Role;
    }

    return {
        id: employee.id,
        userId: employee.userId,
        companyId: employee.companyId,
        name: employee.name,
        status: employee.status,
        email: employee.user.email,
        role: employee.user.role,
        createdAt: employee.createdAt
    };
}

export async function deleteEmployee(id: string): Promise<void> {
    // Delete employee record
    // Note: This won't delete the User record to preserve audit history or allow re-hiring
    await prisma.employee.delete({
        where: { id }
    });
}

export async function assignCalendarToEmployee(employeeId: string, calendarId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found');

    const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
    if (!calendar) throw new Error('Calendar not found');

    if (employee.companyId !== calendar.companyId) {
        throw new Error('Employee and Calendar must belong to the same company');
    }

    await prisma.employeeCalendar.upsert({
        where: { employeeId },
        update: { calendarId },
        create: {
            employeeId,
            calendarId
        }
    });
}
export async function getEmployeeByUserId(userId: string): Promise<EmployeeResponseDto | null> {
    const employee = await prisma.employee.findFirst({
        where: { userId },
        include: { user: true }
    });

    if (!employee) return null;

    return {
        id: employee.id,
        userId: employee.userId,
        companyId: employee.companyId,
        name: employee.name,
        status: employee.status,
        email: employee.user.email,
        role: employee.user.role,
        createdAt: employee.createdAt
    };
}

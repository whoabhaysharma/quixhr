import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../../config';

const prisma = new PrismaClient();

/**
 * Generate JWT token for testing
 */
export function generateToken(
    userId: string,
    email: string,
    role: Role,
    companyId?: string,
    employeeId?: string
): string {
    const payload = {
        id: userId,
        email,
        role,
        companyId,
        employeeId,
    };

    return jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
}

/**
 * Get authorization header with Bearer token
 */
export function getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
    email: string,
    password: string,
    role: Role
) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
            emailVerified: true,
        },
    });
}

/**
 * Create a test company
 */
export async function createTestCompany(name: string, timezone = 'Asia/Kolkata') {
    return prisma.company.create({
        data: {
            name,
            timezone,
        },
    });
}

/**
 * Create a test employee
 */
export async function createTestEmployee(
    name: string,
    companyId: string,
    userId?: string,
    calendarId?: string
) {
    return prisma.employee.create({
        data: {
            name,
            companyId,
            userId,
            calendarId,
            status: 'ACTIVE',
        },
    });
}

/**
 * Create a test calendar
 */
export async function createTestCalendar(
    companyId: string,
    name: string,
    dayStartTime = 540, // 9:00 AM
    dayEndTime = 1080 // 6:00 PM
) {
    return prisma.calendar.create({
        data: {
            companyId,
            name,
            dayStartTime,
            dayEndTime,
        },
    });
}

/**
 * Create a complete test user with company and employee
 */
export async function createCompleteTestUser(
    email: string,
    password: string,
    role: Role,
    companyName: string,
    employeeName: string,
    existingCompanyId?: string
) {
    const user = await createTestUser(email, password, role);

    let company;
    if (existingCompanyId) {
        company = await prisma.company.findUnique({ where: { id: existingCompanyId } });
        if (!company) throw new Error('Company not found');
    } else {
        company = await createTestCompany(companyName);
    }

    const employee = await createTestEmployee(employeeName, company!.id, user.id);

    return {
        user,
        company: company!,
        employee,
        token: generateToken(user.id, user.email, user.role, company!.id, employee.id),
    };
}

export { prisma };

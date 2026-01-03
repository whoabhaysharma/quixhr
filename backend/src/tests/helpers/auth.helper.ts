import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const generateToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
};

export const createTestUser = async (role: Role = Role.SUPER_ADMIN, organizationId?: string) => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create organization if needed and not provided, unless SUPER_ADMIN who might not belong to one (or does?)
    // For simplicity, if not provided and role requires it, create one.
    if (!organizationId && role !== Role.SUPER_ADMIN) {
        const organization = await prisma.organization.create({
            data: {
                name: 'Test Organization',
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                dateFormat: 'DD/MM/YYYY'
            }
        });
        organizationId = organization.id;
    }

    const user = await prisma.user.create({
        data: {
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: hashedPassword,
            role,
            isEmailVerified: true,
        },
    });

    const token = generateToken({ id: user.id, userId: user.id, role: user.role, organizationId: organizationId });

    return { user, token, organizationId };
};

export const createTestEmployee = async (organizationId?: string, role: Role = Role.EMPLOYEE) => {
    // 1. Create User
    const { user, token: _token, organizationId: createdOrganizationId } = await createTestUser(role, organizationId);

    // 2. Create Employee Linked to User
    const employee = await prisma.employee.create({
        data: {
            firstName: 'Test',
            lastName: 'Employee',
            status: 'ACTIVE',
            joiningDate: new Date(),
            organizationId: createdOrganizationId!,
            userId: user.id,
            code: `EMP-${Date.now()}`
        }
    });

    // 3. Re-generate token with employeeId and userId
    const token = generateToken({
        id: user.id,
        userId: user.id, // Explicitly add userId as some controllers expect it
        role: user.role,
        organizationId: createdOrganizationId,
        employeeId: employee.id
    });

    return { user, token, employee };
};

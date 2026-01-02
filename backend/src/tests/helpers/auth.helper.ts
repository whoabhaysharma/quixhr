import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const generateToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
};

export const createTestUser = async (role: Role = Role.SUPER_ADMIN, companyId?: string) => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create company if needed and not provided, unless SUPER_ADMIN who might not belong to one (or does?)
    // For simplicity, if not provided and role requires it, create one.
    if (!companyId && role !== Role.SUPER_ADMIN) {
        const company = await prisma.company.create({
            data: {
                name: 'Test Company',
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                dateFormat: 'DD/MM/YYYY'
            }
        });
        companyId = company.id;
    }

    const user = await prisma.user.create({
        data: {
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: hashedPassword,
            role,
            isEmailVerified: true,
        },
    });

    const token = generateToken({ id: user.id, userId: user.id, role: user.role, companyId: companyId });

    return { user, token, companyId };
};

export const createTestEmployee = async (companyId?: string, role: Role = Role.EMPLOYEE) => {
    // 1. Create User
    const { user, token: _token, companyId: createdCompanyId } = await createTestUser(role, companyId);

    // 2. Create Employee Linked to User
    const employee = await prisma.employee.create({
        data: {
            firstName: 'Test',
            lastName: 'Employee',
            status: 'ACTIVE',
            joiningDate: new Date(),
            companyId: createdCompanyId!,
            userId: user.id,
            code: `EMP-${Date.now()}`
        }
    });

    // 3. Re-generate token with employeeId and userId
    const token = generateToken({
        id: user.id,
        userId: user.id, // Explicitly add userId as some controllers expect it
        role: user.role,
        companyId: createdCompanyId,
        employeeId: employee.id
    });

    return { user, token, employee };
};

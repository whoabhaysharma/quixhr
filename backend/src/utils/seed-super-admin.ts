import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { Logger } from './logger';

/**
 * Seed Super Admin User
 * 
 * Ensures a Super Admin exists in the database on startup.
 * Uses environment variables for credentials.
 */
export const seedSuperAdmin = async () => {
    const { email, password } = config.superAdmin;

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (existingAdmin) {
        // Logger.info('✅ Super Admin already exists');
        return;
    }

    Logger.info('🌱 Seeding Super Admin...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Initial company for super admin (optional, or attach to system company)
    // For now, we just create the user. If the system requires everyone to belong to a company,
    // we might need to create a default "System" company or handle it loosely.
    // Given the schema, Employee is optional for User? No, check schema...
    // Let's check relation. User definition: employee Employee?
    // So Employee is optional. Super Admin might not need an employee record initially unless required by app logic.

    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isEmailVerified: true,
        },
    });

    Logger.info(`✅ Super Admin created: ${email} `);
};

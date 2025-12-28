import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global setup before all tests
beforeAll(async () => {
    // Ensure we're using test database
    if (!process.env.DATABASE_URL?.includes('test')) {
        console.warn('WARNING: Not using test database!');
    }
});

// Global teardown after all tests
afterAll(async () => {
    await prisma.$disconnect();
    // Give time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
});

// Export prisma for use in tests
export { prisma };

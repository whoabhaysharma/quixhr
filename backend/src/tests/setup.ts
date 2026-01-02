import { PrismaClient } from '@prisma/client';
import { redis } from '../infra/redis/redis.connection'; // Relative import or using alias if configured, but relative is safer here if alias fails? setup.ts is in src/tests. 
// Alias @ maps to src. So '@/infra/redis/redis.connection' should work if tsconfig paths are setup for ts-node/jest.
// Jest config usually handles it. I'll use relative path to be safe: '../infra/redis/redis.connection'

const prisma = new PrismaClient();

// Set test environment variables
process.env.NODE_ENV = 'test';

// Global setup before all tests
beforeAll(async () => {
    // Ensure we're using test database
    if (!process.env.DATABASE_URL?.includes('test')) {
        console.warn('WARNING: Not using test database!');
    }
    // Flush Redis to reset rate limits
    await redis.flushall();
});

// Global teardown after all tests
afterAll(async () => {
    await prisma.$disconnect();
    // Give time for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
});

// Export prisma for use in tests
export { prisma };

import { PrismaClient } from '@prisma/client';
import { Logger } from './logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'info',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });

// @ts-ignore
prisma.$on('query', (e: any) => {
    Logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
    });
});

// @ts-ignore
prisma.$on('error', (e: any) => {
    Logger.error('Prisma Error', {
        message: e.message,
        target: e.target,
    });
});

// @ts-ignore
prisma.$on('info', (e: any) => {
    Logger.info('Prisma Info', {
        message: e.message,
    });
});

// @ts-ignore
prisma.$on('warn', (e: any) => {
    Logger.warn('Prisma Warn', {
        message: e.message,
    });
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
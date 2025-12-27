import { createEmailWorker } from '../infra/workers/email.worker';
import { closeRedis } from '../infra/redis/redis.connection';

/**
 * Email Worker Bootstrap
 * 
 * Standalone process entry point for email worker.
 * Run this as a separate process: node dist/workers/email.worker.bootstrap.js
 */

const worker = createEmailWorker();

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);

    try {
        // Close worker
        await worker.close();
        console.log('✅ Worker closed');

        // Close Redis connection
        await closeRedis();
        console.log('✅ Redis connection closed');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
});

console.log('🚀 Email worker process started');
console.log('📧 Waiting for email jobs...');


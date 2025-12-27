import { auditWorker } from './audit.worker';
import { createEmailWorker } from '../infra/workers/email.worker';

const emailWorker = createEmailWorker();

// Start all workers
export const startWorkers = () => {
    console.log('🚀 Starting workers...');

    // Resume if paused/needed, or just importing them initializes them (BullMQ)
    auditWorker.resume();
    emailWorker.resume();

    console.log('✅ Workers started');
};

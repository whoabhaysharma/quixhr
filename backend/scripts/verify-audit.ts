
import { PrismaClient } from '@prisma/client';
import { logAction } from '../src/modules/audit/audit.service';
// Import the worker to ensure it starts listening
import '../src/workers/audit.worker';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Audit Logs (with local worker)...');

    try {
        // 1. Create a test log
        console.log('Dispatching test audit log...');
        await logAction({
            userId: 'test-user-id',
            action: 'TEST_ACTION',
            resource: 'TestResource',
            resourceId: 'test-resource-id',
            details: { message: 'This is a test log' },
            ipAddress: '127.0.0.1'
        });

        // Wait for worker to process
        console.log('Waiting for worker to process (5s)...');
        await new Promise(r => setTimeout(r, 5000));

        // 2. Check DB
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log(`Found ${logs.length} recent audit logs.`);

        if (logs.length > 0) {
            console.log('Latest Logs:');
            logs.forEach(log => {
                console.log(`- [${log.createdAt.toISOString()}] User: ${log.userId}, Action: ${log.action}, Resource: ${log.resource}`);
            });
            // Check if our test log is there
            const testLog = logs.find(l => l.action === 'TEST_ACTION');
            if (testLog) {
                console.log('SUCCESS: Test audit log created and found!');
            } else {
                console.log('WARNING: Test log not found yet. Queue might be slow.');
            }
        } else {
            console.log('WARNING: No logs found even after dispatching.');
        }

    } catch (error) {
        console.error('Error verifying logs:', error);
    } finally {
        await prisma.$disconnect();
        // We need to exit explicitly because the worker keeps the process alive
        process.exit(0);
    }
}

main();

import 'dotenv/config';
import app from './app';
import { setupCleanupQueue } from './infra/queues/cleanup.queue';
import { setupCleanupWorker } from './infra/workers';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);

    // Start workers
    setupCleanupWorker();

    // Initialize queues & schedules
    await setupCleanupQueue();
});

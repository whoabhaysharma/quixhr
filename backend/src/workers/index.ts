import { parentPort } from 'worker_threads';
import { Logger } from '../utils/logger';
import './email.worker'; // Import to register the worker
import './notification.worker'; // Import to register the notification worker

Logger.info('Worker process started');

// Keep the worker alive
if (parentPort) {
    parentPort.on('message', (message) => {
        Logger.info('Worker received message:', { message });
    });
} else {
    // If not running as a worker thread (e.g. dev mode standalone), keep process alive or just exit if just testing
    Logger.info('Running in standalone mode - Workers active');
}


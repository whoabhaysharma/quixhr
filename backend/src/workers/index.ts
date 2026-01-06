import { parentPort } from 'worker_threads';
import './email.worker'; // Import to register the worker

console.log('Worker process started');

// Keep the worker alive
if (parentPort) {
    parentPort.on('message', (message) => {
        console.log('Worker received message:', message);
    });
} else {
    // If not running as a worker thread (e.g. dev mode standalone), keep process alive or just exit if just testing
    console.log('Running in standalone mode - Workers active');
}


import { parentPort } from 'worker_threads';

console.log('Worker thread started');

// Keep the worker alive
if (parentPort) {
    parentPort.on('message', (message) => {
        console.log('Worker received message:', message);
    });
} else {
    // If not running as a worker thread (e.g. dev mode standalone), keep process alive or just exit if just testing
    console.log('Running in standalone mode');
    // Simple interval to keep it alive for dev purposes if needed, or just let it sit. 
    // For dev:worker script it runs indefinitely with --respawn, so just logging is enough.
}

import app from './app';
import { config } from './config';

console.log('🔄 Starting QuixHR Backend... (via app.ts)');

app.listen(config.port, () => {
  console.log(`✅ Server running on port ${config.port}`);
  console.log(`📖 Environment: ${config.env}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { Logger } from './utils/logger';

import { seedSuperAdmin } from './utils/seed-super-admin';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await seedSuperAdmin();
  app.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);
  });
};

startServer();

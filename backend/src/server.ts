import dotenv from 'dotenv';
dotenv.config();

import app from './app';

import { seedSuperAdmin } from './utils/seed-super-admin';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await seedSuperAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

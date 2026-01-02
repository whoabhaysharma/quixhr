import dotenv from 'dotenv';
dotenv.config();

import app from './app';

import { seedSuperAdmin } from './utils/seed-super-admin';

const PORT = 4000; // process.env.PORT || 4000;

const startServer = async () => {
  await seedSuperAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

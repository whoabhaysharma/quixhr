import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './config/database';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import leaveRoutes from './routes/leaves';
import organizationRoutes from './routes/organizations';
import subscriptionRoutes from './routes/subscriptions';

const app: Express = express();

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(morgan(config.logging.level));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: `${config.app.name} is running` });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');

    app.listen(config.app.port, () => {
      console.log(`${config.app.name} running on port ${config.app.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

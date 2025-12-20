import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || 'Leave Application API',
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRE_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;

interface Config {
  port: number;
  env: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
  };
  superAdminEmail: string;
}

const config: Config = {
  port: 4000,
  env: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/quixhr',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?
      process.env.CORS_ORIGIN.split(',') :
      ['http://localhost:3000', 'http://localhost:3001'],
  },
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
};

export { config };
# QuixHR Backend

A modern Express.js REST API backend for HR Management System built with TypeScript.

## Features

- ✅ Express.js with TypeScript
- ✅ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Request logging with Morgan
- ✅ Error handling middleware
- ✅ Health check endpoints
- ✅ Docker support for development and production
- ✅ Hot reload in development
- ✅ PostgreSQL database integration ready

## Quick Start

### Using Docker (Recommended)

1. **Start the application:**
   ```bash
   docker compose up --build
   ```

2. **Access the API:**
   - Backend: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Database: localhost:5433

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system information

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.example` |
| `JWT_SECRET` | JWT secret key | `supersecret-jwt-key` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000,http://localhost:3001` |

## Docker Commands

```bash
# Development
docker compose up --build

# Production build
docker build -f Dockerfile.prod -t quixhr-backend:prod .

# Run production container
docker run -p 3000:3000 --env-file .env quixhr-backend:prod
```

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── app.ts          # Express app configuration
└── index.ts        # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
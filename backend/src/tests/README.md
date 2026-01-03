# Test Suite for QuixHR Backend

This directory contains comprehensive integration tests for all backend API endpoints.

## Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js & npm

### 2. Environment Setup
The tests rely on a dedicated PostgreSQL database and Redis instance running in Docker.

```bash
# Start test services
docker-compose up -d db redis

# Create .env.test
cp .env.test.example .env.test

# Run migrations on test DB
export DATABASE_URL="postgresql://user:password@localhost:5433/quixhr_test"
npx prisma migrate deploy
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx jest src/tests/auth.test.ts
```

## Test Structure

- **auth.test.ts**: Authentication (Register, Login, Logout)
- **organizations.test.ts**: Organization management
- **employees.test.ts**: Employee CRUD and management
- **leaves.test.ts**: Leave grades, policies, and requests
- **attendance.test.ts**: Clock-in/out and attendance logs
- **calendars.test.ts**: Calendar, holiday, and work week management
- **allocations.test.ts**: Leave allocations
- **invitations.test.ts**: User invitations
- **me.test.ts**: Personal profile and self-service
- **users.test.ts**: User management (Super Admin)
- **dashboard.test.ts**: Dashboard statistics
- **admin.test.ts**: Platform admin dashboard

## Note on Database
Tests will automatically clean the database before each test suite to ensure isolation. Ensure your test database URL is correct in `.env.test`.

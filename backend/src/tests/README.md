# Test Suite for QuixHR Backend

This directory contains comprehensive integration tests for all backend API endpoints with role-based access control verification.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Test Database

Create a separate PostgreSQL database for testing:

```bash
createdb quixhr_test
```

### 3. Configure Test Environment

Create a `.env.test` file in the backend root directory:

```bash
cp .env.test.example .env.test
```

Update the `.env.test` file with your test database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quixhr_test"
JWT_SECRET="test-jwt-secret-key"
# ... other required environment variables
```

### 4. Run Migrations on Test Database

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/quixhr_test" npx prisma migrate deploy
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Module Tests

```bash
npm test -- auth.test.ts
npm test -- company.test.ts
npm test -- member.test.ts
npm test -- calendar.test.ts
npm test -- attendance.test.ts
npm test -- leave.test.ts
npm test -- invitation.test.ts
npm test -- audit.test.ts
```

## Test Structure

### Test Modules

- **auth.test.ts** - Authentication (register, login, verify email, current user)
- **company.test.ts** - Company management (CRUD operations)
- **member.test.ts** - Member/Employee management (CRUD operations)
- **calendar.test.ts** - Calendar management (CRUD, holidays, weekly rules)
- **attendance.test.ts** - Attendance tracking (clock-in/out, history)
- **leave.test.ts** - Leave management (apply, approve, balances)
- **invitation.test.ts** - Invitation system (create, validate, accept)
- **audit.test.ts** - Audit logs (view, filter)

### Role-Based Access Control

Tests verify proper access control for four user roles:

- **SUPER_ADMIN** - Full system access
- **HR_ADMIN** - Company-wide administrative access
- **MANAGER** - Team management access
- **EMPLOYEE** - Limited self-service access

Each test suite verifies that:
- ✅ Authorized roles can access endpoints
- ❌ Unauthorized roles receive 403 Forbidden
- ❌ Unauthenticated requests receive 401 Unauthorized

## Test Helpers

### Authentication Helpers (`tests/helpers/auth.helper.ts`)

- `generateToken()` - Generate JWT tokens for testing
- `getAuthHeader()` - Format authorization header
- `createTestUser()` - Create test user in database
- `createTestCompany()` - Create test company
- `createTestEmployee()` - Create test employee
- `createTestCalendar()` - Create test calendar
- `createCompleteTestUser()` - Create user with company and employee

### Database Helpers (`tests/helpers/db.helper.ts`)

- `cleanDatabase()` - Clean all test data (runs before each test)
- `seedTestData()` - Seed common test data

## Coverage

Run coverage report to see which endpoints and scenarios are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Important Notes

1. **Test Database**: Always use a separate test database. Tests will clean the database before each test suite.

2. **Sequential Execution**: Tests run with `--runInBand` flag to avoid database conflicts.

3. **Test Isolation**: Each test suite cleans the database before running to ensure isolation.

4. **Integration Tests**: These are integration tests that make actual HTTP requests and verify database state.

## Troubleshooting

### Database Connection Errors

Ensure your test database is running and the `DATABASE_URL` in `.env.test` is correct.

### Test Timeouts

If tests timeout, increase the timeout in `jest.config.js`:

```javascript
testTimeout: 60000, // 60 seconds
```

### Port Conflicts

If you get port conflicts, ensure no other instance of the backend is running.
